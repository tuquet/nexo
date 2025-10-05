import { IpcMain, dialog } from 'electron'
import path from 'node:path'
import { spawn, type ChildProcess, exec } from 'node:child_process'
import process from 'node:process'
import fs from 'node:fs/promises'
import log from 'electron-log'
import { getMainWindow } from '../../bootstrap/window'
import { ensureBinaries } from '../../lib/binary-manager'
import { ensureYtDlp } from '../../lib/yt-dlp-manager'

/**
 * Appends cookie-related arguments to the yt-dlp command.
 * @param args The array of arguments to be passed to yt-dlp.
 * @param filePath The path to the cookie file.
 */
const addCookieArgs = (args: string[], filePath: string): void => {
  log.info(`[Video] Using cookie file at: ${filePath}`)
  args.push('--cookies', filePath)
}

// Map để lưu trữ các tiến trình download đang hoạt động, với key là URL của video.
const activeDownloads = new Map<string, ChildProcess>()

// Set để theo dõi các tác vụ đã bị người dùng hủy.
const canceledJobs = new Set<string>()

/**
 * Registers IPC handlers for video downloading functionalities.
 * This module is responsible for interacting with the `yt-dlp` command-line tool
 * to fetch video information and download videos.
 * @param ipc The IpcMain instance.
 */
export function Video(ipc: IpcMain): void {
  /**
   * Fetches video metadata from a given URL using yt-dlp.
   * It returns the raw JSON output from yt-dlp, letting the frontend handle data mapping.
   */
  ipc.handle(
    'video:get-formats',
    async (
      _,
      videoUrl: string,
      options?: {
        useCookieFile?: boolean
        cookieFilePath?: string
        downloadPlaylist?: boolean
      }
    ) => {
      log.info(`[Video] Fetching formats for URL: ${videoUrl}`)
      try {
        const ytdlpPath = await ensureYtDlp()
        log.info(`[Video] Using yt-dlp at: ${ytdlpPath}`)

        const isPlaylist = videoUrl.includes('list=') && options?.downloadPlaylist

        const args = [
          videoUrl,
          '--dump-single-json',
          '--ignore-errors',
          '--no-warnings',
          '--no-call-home',
          '--encoding',
          'utf-8',
          '--no-color'
        ]

        // Nếu không tải playlist, chỉ lấy thông tin của video chính trong URL
        if (!isPlaylist) {
          args.push('--no-playlist')
        }

        if (isPlaylist) {
          args.push('--flat-playlist')
        }

        if (options?.useCookieFile && options.cookieFilePath) {
          addCookieArgs(args, options.cookieFilePath)
        }

        const process = spawn(ytdlpPath, args, { windowsHide: true })

        let stdoutData = ''
        let stderrData = ''
        process.stdout.on('data', (data) => {
          stdoutData += data.toString()
        })
        process.stderr.on('data', (data) => {
          stderrData += data.toString()
          // log.verbose(`[Video GetFormats stderr]: ${data.toString().trim()}`)
        })

        return new Promise((resolve, reject) => {
          process.on('close', (code) => {
            // yt-dlp may exit with a non-zero code if it fails to find cookies for a specific browser,
            // even if it succeeds for others. We should treat this as a warning if we still get JSON output.
            const isCookieError =
              stderrData.includes('could not find') && stderrData.includes('cookies database')

            if (stdoutData.trim() && (code === 0 || isCookieError)) {
              try {
                // yt-dlp với --dump-single-json sẽ xuất ra một đối tượng JSON trên mỗi dòng cho playlist.
                // Chúng ta chỉ cần parse và trả về dữ liệu thô.
                const lines = stdoutData.trim().split('\n').filter(Boolean)
                const results = lines.map((line) => JSON.parse(line)).filter(Boolean)

                log.info(`[Video] Fetched info for ${results.length} item(s) from URL.`)
                resolve(results)
              } catch (e) {
                log.error(
                  '[Video] Failed to parse yt-dlp JSON output:',
                  e,
                  'Raw output:',
                  stdoutData
                )
                reject({ code: 'PARSE_ERROR', message: 'Failed to parse video metadata.' })
              }
            } else {
              // Nếu không có stdout, hoặc lỗi không phải là vấn đề cookie đã biết, hãy từ chối.
              const stderr = stderrData.trim()
              log.error(`[Video] yt-dlp exited with code ${code}. Stderr: ${stderr}`)

              if (stderr.includes('Unsupported URL')) {
                reject({ code: 'UNSUPPORTED_URL', message: stderr })
              } else if (stderr.includes('Fresh cookies') && stderr.includes('are needed')) {
                reject({ code: 'COOKIES_NEEDED', message: stderr })
              } else if (
                options?.useCookieFile &&
                stderr.toLowerCase().includes('http error 403')
              ) {
                reject({ code: 'HTTP_403_FORBIDDEN', message: stderr })
              } else {
                // Lỗi chung chung
                reject({ code: 'FETCH_FAILED', message: stderr })
              }
            }
          })

          process.on('error', (err) => {
            log.error('[Video] Failed to spawn yt-dlp process:', err)
            reject(err)
          })
        })
      } catch (error: any) {
        // Log toàn bộ đối tượng lỗi để có thêm thông tin, vì 'error.message' có thể trống.
        // Đặc biệt là các lỗi liên quan đến process spawn (ENOENT).
        log.error(`[Video] Error fetching formats for ${videoUrl}:`, error)
        const errorMessage = error.stderr || error.message || 'Unknown error'
        // Throw a structured error that the frontend can handle
        throw { code: 'PROCESS_ERROR', message: errorMessage }
      }
    }
  )

  ipc.handle(
    /**
     * Downloads a video from a URL to a specified path.
     * It streams progress back to the renderer and resolves with the final file path upon completion.
     */
    'video:download-video',
    async (
      _,
      {
        jobId,
        videoUrl,
        outputPath,
        formatCode,
        isAudioOnly,
        downloadPlaylist,
        useCookieFile,
        cookieFilePath
      }: {
        jobId: string
        videoUrl: string
        outputPath: string
        formatCode?: string
        isAudioOnly?: boolean
        downloadPlaylist?: boolean
        useCookieFile?: boolean
        cookieFilePath?: string
      }
    ) => {
      // Xóa trạng thái hủy cũ (nếu có) khi bắt đầu một tác vụ mới với cùng jobId
      canceledJobs.delete(jobId)

      const mainWindow = getMainWindow()
      log.info(`[Video] Starting video download from URL: ${videoUrl}`)
      if (!mainWindow) {
        log.error('[Video] Main window not found.')
        throw new Error('Main window does not exist.')
      }

      let ffmpegPath: string, ytdlpPath: string
      try {
        log.info('[Video] Verifying required binaries (FFmpeg & yt-dlp)...')
        const [binaries, ytdlp] = await Promise.all([ensureBinaries(), ensureYtDlp()])
        ffmpegPath = binaries.ffmpeg
        ytdlpPath = ytdlp
        log.info(`[Video] Using ffmpeg at: ${ffmpegPath}`)
        log.info(`[Video] Using yt-dlp at: ${ytdlpPath}`)
      } catch (error: any) {
        log.error('[Video] Failed to get required binaries:', error)
        throw new Error(`Failed to prepare tools: ${error.message}`)
      }

      // Sử dụng template của yt-dlp để tự động đặt tên file.
      // Tên file được làm sạch: không dấu, khoảng trắng thay bằng gạch nối.
      let outputTemplate: string
      if (isAudioOnly) {
        // Đối với audio, template đơn giản là tốt nhất. Phần mở rộng sẽ là mp3.
        outputTemplate = path.join(outputPath, '%(title)s.%(ext)s')
      } else {
        // Thay thế " [%(height)sp]" bằng "-%(height)sp" để có tên file thân thiện hơn.
        outputTemplate = path.join(outputPath, '%(title)s-%(height)sp.%(ext)s')
      }
      log.info(`[Video] Output template: ${outputTemplate}`)

      return new Promise((resolve, reject) => {
        const args: string[] = [
          videoUrl,
          '--output',
          outputTemplate,
          '--merge-output-format',
          'mp4',
          '--no-warnings',
          '--no-call-home',
          '--ffmpeg-location',
          ffmpegPath,
          '--no-check-certificates',
          '--encoding',
          'utf-8',
          '--no-color',
          // Làm sạch tên file: chỉ giữ lại ký tự ASCII và thay thế khoảng trắng.
          '--restrict-filenames',
          // Thay thế một hoặc nhiều khoảng trắng bằng một dấu gạch nối trong tiêu đề.
          '--replace-in-metadata',
          'title',
          '\\s+',
          '-'
        ]

        // Thêm cờ để sử dụng cookies từ trình duyệt nếu được yêu cầu
        if (useCookieFile && cookieFilePath) {
          addCookieArgs(args, cookieFilePath)
        }

        // Chỉ thêm cờ --no-playlist nếu người dùng không yêu cầu tải playlist
        if (!downloadPlaylist) {
          args.push('--no-playlist')
        }

        if (isAudioOnly) {
          log.info('[Video] Audio only download requested. Setting format to mp3.')
          args.push('--extract-audio', '--audio-format', 'mp3', '--format', 'bestaudio/best')
        } else if (formatCode) {
          log.info(`[Video] Using selected format code: ${formatCode}`)
          args.push('--format', `${formatCode}+bestaudio/${formatCode}`)
        } else {
          log.info('[Video] No format code selected, using default best quality.')
          args.push('--format', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best')
        }

        const isWindows = process.platform === 'win32'
        const subprocess = spawn(ytdlpPath, args, {
          detached: !isWindows, // Chỉ dùng detached trên non-Windows để kill process group
          windowsHide: true
        })
        activeDownloads.set(jobId, subprocess) // Lưu tiến trình vào map
        log.info('[Video] yt-dlp process started.')

        // Regex to parse progress from yt-dlp output
        const progressRegex = /\[download\]\s+([\d.]+)%/
        // Regex to find the final output file path from yt-dlp's stdout
        const destinationRegex =
          /\[(?:Merger|download)\] Merging formats into "([^"]+)"|\[download\] Destination:\s(.+)/
        // Regex mới để xử lý trường hợp file đã được tải xuống
        const alreadyDownloadedRegex = /\[download\]\s+(.+?)\s+has already been downloaded/
        // Regex to find the video title
        const titleRegex = /\[info\] Title:\s(.+)/
        let videoTitle: string | null = null
        const stdoutBuffer: string[] = []
        const stderrBuffer: string[] = []

        const handleDataChunk = (text: string): void => {
          // yt-dlp can output multiple progress lines in a single data chunk.
          // We find all of them and use the last one for the most up-to-date percentage.
          const allProgressMatches = text.match(new RegExp(progressRegex, 'g'))
          if (allProgressMatches) {
            const lastMatchText = allProgressMatches[allProgressMatches.length - 1]
            const progressMatch = lastMatchText.match(progressRegex) // Re-match to get capture groups
            if (progressMatch && progressMatch[1]) {
              const percent = parseFloat(progressMatch[1])
              mainWindow.webContents.send('video:download-progress', {
                percent,
                key: videoUrl,
                title: videoTitle // Title might be null initially, but that's ok
              })
            }
          }

          // Parse title from the chunk (only once)
          if (!videoTitle) {
            const titleMatch = text.match(titleRegex)
            if (titleMatch && titleMatch[1]) {
              videoTitle = titleMatch[1].trim()
              mainWindow.webContents.send('video:download-started', {
                key: videoUrl,
                title: videoTitle
              })
            }
          }
        }

        subprocess.stdout?.on('data', (data) => {
          const text = data.toString() // Convert buffer to string
          // Ghi log stdout dưới dạng verbose và đẩy vào buffer
          log.verbose(`[Video] stdout: ${text.trim()}`)
          stdoutBuffer.push(text)
          handleDataChunk(text)
        })

        subprocess.stderr?.on('data', (data) => {
          const text = data.toString()
          log.error(`[Video] stderr: ${text.trim()}`)
          stderrBuffer.push(text)
          // yt-dlp often prints progress to stderr, so we parse it here too
          handleDataChunk(text)
        })

        subprocess.on('close', (code, signal) => {
          activeDownloads.delete(jobId) // Xóa tiến trình khỏi map khi nó kết thúc

          // Ưu tiên kiểm tra xem tác vụ có bị người dùng hủy hay không.
          // Đây là cách đáng tin cậy nhất để xác định việc hủy bỏ, đặc biệt trên Windows.
          if (canceledJobs.has(jobId)) {
            canceledJobs.delete(jobId) // Dọn dẹp set
            log.info(`[Video] Download for ${videoUrl} was canceled by the user. Cleaning up...`)

            // Khi hủy, hãy cố gắng dọn dẹp các file tạm (.part) mà yt-dlp để lại.
            const fullOutput = stdoutBuffer.join('') + stderrBuffer.join('')
            const destinationRegexGlobal =
              /\[(?:Merger|download)\] Merging formats into "([^"]+)"|\[download\] Destination:\s(.+)/g
            const destinationMatches = [...fullOutput.matchAll(destinationRegexGlobal)]

            const filesToDelete = new Set<string>()

            destinationMatches.forEach((match) => {
              const filePath = (match[1] || match[2])?.trim()
              if (filePath) {
                // Thêm cả file tạm (.part) và file trung gian đã hoàn thành (ví dụ: video.f137.mp4).
                filesToDelete.add(filePath)
                filesToDelete.add(`${filePath}.part`)
              }
            })

            if (filesToDelete.size > 0) {
              log.info(`[Video] Cleaning up temporary files:`, [...filesToDelete])
              // Chạy việc xóa trong nền, không cần đợi. `force: true` để không báo lỗi nếu file không tồn tại.
              Promise.all([...filesToDelete].map((file) => fs.rm(file, { force: true })))
            }

            return reject({
              code: 'DOWNLOAD_CANCELED',
              message: 'Tác vụ đã bị người dùng dừng lại.'
            })
          }

          // Nếu tiến trình bị dừng bởi một tín hiệu (ví dụ: do người dùng bấm nút "Dừng")
          if (signal) {
            log.info(`[Video] Download for ${videoUrl} was terminated by signal: ${signal}.`)
            return reject({
              code: 'DOWNLOAD_CANCELED',
              message: 'Tác vụ đã bị người dùng dừng lại.'
            })
          }

          const fullStderr = stderrBuffer.join('')
          const fullStdout = stdoutBuffer.join('')
          const fullOutput = fullStdout + fullStderr

          // --- Success Conditions ---

          // 1. File was already downloaded. This is a success.
          const alreadyDownloadedMatch = fullOutput.match(alreadyDownloadedRegex)
          if (alreadyDownloadedMatch && alreadyDownloadedMatch[1]) {
            const existingPath = alreadyDownloadedMatch[1].trim()
            log.info(`[Video] Bỏ qua tải xuống, file đã tồn tại: ${existingPath}`)
            if (!videoTitle) {
              const titleMatch = fullOutput.match(titleRegex)
              if (titleMatch && titleMatch[1]) videoTitle = titleMatch[1].trim()
            }
            return resolve({
              filePath: existingPath,
              key: videoUrl,
              title: videoTitle,
              outputPath
            })
          }

          // 2. A file was created. This is the most reliable indicator of success,
          // as yt-dlp might exit with a non-zero code for non-fatal issues.
          // Use matchAll to find all destination lines and prioritize the last one,
          // which is typically the final merged file.
          const destinationMatches = [...fullOutput.matchAll(new RegExp(destinationRegex, 'g'))]
          if (destinationMatches.length > 0) {
            const lastMatch = destinationMatches[destinationMatches.length - 1]
            const finalPath = (lastMatch[1] || lastMatch[2])?.trim()
            if (finalPath) {
              log.info(
                `[Video] Download successful (exit code ${code}). Title: ${videoTitle}, Path: ${finalPath}`
              )
              return resolve({
                filePath: finalPath,
                key: videoUrl,
                title: videoTitle,
                outputPath
              })
            }
          }

          // 3. Playlist download finished with exit code 0 (no single file path).
          if (code === 0 && downloadPlaylist) {
            log.info(
              `[Video] Playlist download completed successfully. Files are in '${outputPath}'.`
            )
            return resolve({
              filePath: null,
              key: videoUrl,
              title: videoTitle || 'Playlist',
              outputPath
            })
          }

          // --- Failure Conditions ---
          // If we reach here, the download has failed. Now, determine the best error message.
          log.error(`[Video] Process exited with code: ${code}. Stderr: ${fullStderr}`)

          if (fullStderr.includes('Fresh cookies') && fullStderr.includes('are needed')) {
            return reject({
              code: 'COOKIES_NEEDED',
              message: fullStderr
            })
          }

          // Thêm check cho lỗi HTTP 403 khi đang dùng cookie
          if (useCookieFile && fullStderr.toLowerCase().includes('http error 403')) {
            return reject({
              code: 'HTTP_403_FORBIDDEN',
              message: fullStderr
            })
          }

          const hasCookieError =
            fullStderr.includes('could not find') && fullStderr.includes('cookies database')
          const hasOtherFatalErrors = fullStderr.split('\n').some((line) => {
            const lowerLine = line.toLowerCase()
            return (
              lowerLine.includes('error:') &&
              // Bỏ qua lỗi "could not find cookies" vì nó không phải là lỗi nghiêm trọng nếu có các lỗi khác
              !(lowerLine.includes('could not find') && lowerLine.includes('cookies database'))
            )
          })

          if (hasCookieError && !hasOtherFatalErrors) {
            // Lỗi này xảy ra khi yt-dlp cố gắng tự động tìm cookie từ trình duyệt nhưng thất bại.
            // Nó thường chỉ ra rằng video yêu cầu đăng nhập (giới hạn độ tuổi, riêng tư).
            return reject({
              code: 'AUTH_REQUIRED',
              message: fullStderr
            })
          }

          // For all other errors, use the stderr content.
          const errorMessage = fullStderr.trim() || `Download failed with exit code: ${code}.`
          reject({ code: 'DOWNLOAD_FAILED', message: errorMessage })
        })

        subprocess.on('error', (error) => {
          activeDownloads.delete(jobId) // Xóa tiến trình khỏi map khi có lỗi
          log.error('[Video] Error executing yt-dlp process:', error)
          reject({ code: 'PROCESS_ERROR', message: error.message })
        })
      })
    }
  )

  /**
   * Stops a running video download process.
   */
  ipc.handle('video:stop-download', async (_, jobId: string) => {
    const subprocess = activeDownloads.get(jobId)
    if (subprocess && subprocess.pid) {
      const pid = subprocess.pid
      log.info(`[Video] Received request to stop download for job: ${jobId}, PID: ${pid}`)

      // Đánh dấu tác vụ này là đã bị hủy TRƯỚC KHI kill process.
      // Điều này đảm bảo rằng 'close' event handler sẽ nhận biết được.
      canceledJobs.add(jobId)

      // The 'close' event on the subprocess will handle cleanup (e.g., removing from activeDownloads).
      // We just need to issue the kill command.
      if (process.platform === 'win32') {
        // On Windows, use taskkill to terminate the process and its children (/T flag).
        // The /F flag forcefully terminates the process.
        exec(`taskkill /PID ${pid} /T /F`, { windowsHide: true }, (err) => {
          if (err) {
            // It's common to get an error if the process has already finished.
            // We log it as a warning instead of an error.
            log.warn(
              `[Video] taskkill for PID ${pid} failed, process might have already finished:`,
              err.message
            )
          } else {
            log.info(`[Video] Successfully issued taskkill for process tree of PID ${pid}.`)
          }
        })
      } else {
        // On macOS/Linux, kill the process group by passing a negative PID.
        // This requires the child process to be spawned with `detached: true`.
        try {
          // A negative PID kills the entire process group.
          process.kill(-pid, 'SIGKILL') // Using SIGKILL for a more immediate termination.
          log.info(`[Video] Successfully sent SIGKILL to process group -${pid}.`)
        } catch (err: any) {
          // This can fail if the process is already gone (race condition).
          log.warn(
            `[Video] process.kill for group -${pid} failed, process might have already finished:`,
            err.message
          )
        }
      }
      return { success: true }
    }
    log.warn(`[Video] Stop request for non-existent download job: ${jobId}`)
    return { success: false, message: 'Không tìm thấy tiến trình.' }
  })
  /**
   * Opens a native dialog for the user to select a cookie file.
   */
  ipc.handle('video:select-cookie-file', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Chọn file cookie',
      properties: ['openFile'],
      filters: [
        { name: 'Cookie Files', extensions: ['txt'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })
    if (canceled) {
      return null
    }
    return filePaths[0]
  })

  /**
   * Deletes a file from the filesystem.
   */
  ipc.handle('video:delete-file', async (_, filePath: string) => {
    log.info(`[Video] Received request to delete file: ${filePath}`)
    try {
      // Use fs.rm to delete the file. `force: true` prevents an error if the file doesn't exist.
      await fs.rm(filePath, { force: true })
      log.info(`[Video] Successfully deleted file: ${filePath}`)
      return { success: true }
    } catch (error: any) {
      log.error(`[Video] Failed to delete file ${filePath}:`, error)
      // Re-throw a structured error for the frontend
      throw new Error(`Không thể xóa file: ${error.message}`)
    }
  })
}
