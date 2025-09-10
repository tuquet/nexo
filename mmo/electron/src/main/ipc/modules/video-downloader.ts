import { IpcMain, dialog } from 'electron'
import path from 'node:path'
import { spawn } from 'node:child_process'
import log from 'electron-log'
import { getMainWindow } from '../../bootstrap/window'
import { ensureBinaries } from '../../lib/binary-manager'
import { ensureYtDlp } from '../../lib/yt-dlp-manager'

/**
 * Thêm các tham số cookie vào danh sách đối số của yt-dlp.
 * @param args Mảng các đối số sẽ được truyền cho yt-dlp.
 * @param filePath Đường dẫn đến file cookie.
 */
const addCookieArgs = (args: string[], filePath: string): void => {
  log.info(`[Video] Using cookie file at: ${filePath}`)
  args.push('--cookies', filePath)
}

export function Video(ipc: IpcMain): void {
  /**
   * Lấy danh sách các định dạng video và audio có sẵn từ một URL Video.
   * Trả về một mảng các định dạng đã được xử lý để hiển thị trên giao diện người dùng.
   */
  ipc.handle(
    'Video:get-formats',
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

        const process = spawn(ytdlpPath, args)

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
                // Chúng ta cần xử lý tất cả các dòng.
                const lines = stdoutData.trim().split('\n').filter(Boolean)
                const results = lines
                  .map((line) => {
                    const metadata = JSON.parse(line)

                    if (typeof metadata === 'string' || !metadata) {
                      log.warn('[Video] Invalid metadata line skipped:', line)
                      return null
                    }

                    // Đối với playlist phẳng, chúng ta lấy thông tin cơ bản.
                    // Đối với video đơn, chúng ta có thể lấy danh sách định dạng đầy đủ.
                    const formats = (metadata.formats || [])
                      .filter(
                        (f: any) =>
                          (f.resolution || (f.acodec && f.acodec !== 'none')) &&
                          f.vcodec !== 'none' &&
                          f.ext !== 'mhtml'
                      )
                      .map((f: any) => {
                        const sizeMB = f.filesize || f.filesize_approx
                        const sizeText = sizeMB ? `~${(sizeMB / 1024 / 1024).toFixed(1)} MB` : ''
                        return {
                          format_id: f.format_id,
                          label:
                            `${f.resolution} (${f.ext}) - ${f.format_note || 'Video'} ${sizeText}`.trim()
                        }
                      })

                    return {
                      formats,
                      thumbnail: metadata.thumbnail || null,
                      title: metadata.title || 'Unknown Title',
                      url: metadata.webpage_url || metadata.url
                    }
                  })
                  .filter(Boolean) // Loại bỏ các dòng không hợp lệ

                log.info(`[Video] Fetched info for ${results.length} item(s) from URL.`)
                resolve(results)
              } catch (e) {
                log.error(
                  '[Video] Failed to parse yt-dlp JSON output:',
                  e,
                  'Raw output:',
                  stdoutData
                )
                reject(new Error('Failed to parse video metadata.'))
              }
            } else {
              // Nếu không có stdout, hoặc lỗi không phải là vấn đề cookie đã biết, hãy từ chối.
              const stderr = stderrData.trim()
              log.error(`[Video] yt-dlp exited with code ${code}. Stderr: ${stderr}`)

              if (stderr.includes('Unsupported URL')) {
                reject(
                  new Error(
                    `URL không được hỗ trợ. Vui lòng đảm bảo bạn đã sao chép đúng đường dẫn trực tiếp của video (ví dụ: https://www.douyin.com/video/...). Các đường dẫn dạng "jingxuan" hoặc "modal" có thể không hoạt động.`
                  )
                )
              } else if (stderr.includes('Fresh cookies') && stderr.includes('are needed')) {
                reject(
                  new Error(
                    `Trang web này yêu cầu cookie để tiếp tục. Vui lòng bật tùy chọn "Sử dụng cookie" và cung cấp file cookies.txt hợp lệ. Bạn có thể lấy file này bằng tiện ích mở rộng trình duyệt như "Get cookies.txt (local)".`
                  )
                )
              } else if (
                options?.useCookieFile &&
                stderr.toLowerCase().includes('http error 403')
              ) {
                reject(
                  new Error(
                    `Lấy thông tin thất bại (Lỗi 403: Bị cấm). Cookie bạn cung cấp có thể không hợp lệ hoặc đã hết hạn. Vui lòng thử xuất lại file cookie và thử lại.`
                  )
                )
              } else {
                // Lỗi chung chung, chỉ hiển thị thông báo từ yt-dlp
                reject(new Error(`Lỗi khi lấy thông tin video: ${stderr}`))
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
        throw new Error(`Lỗi khi lấy thông tin video: ${errorMessage}`)
      }
    }
  )

  ipc.handle(
    'Video:download-video',
    async (
      _,
      {
        videoUrl,
        outputPath,
        formatCode,
        isAudioOnly,
        downloadPlaylist,
        useCookieFile,
        cookieFilePath
      }: {
        videoUrl: string
        outputPath: string
        formatCode?: string
        isAudioOnly?: boolean
        downloadPlaylist?: boolean
        useCookieFile?: boolean
        cookieFilePath?: string
      }
    ) => {
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

        const subprocess = spawn(ytdlpPath, args)
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
              mainWindow.webContents.send('Video:download-progress', {
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
              mainWindow.webContents.send('Video:download-started', {
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

        subprocess.on('close', (code) => {
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
            return reject(
              new Error(
                `Trang web này yêu cầu cookie để tiếp tục. Vui lòng bật tùy chọn "Sử dụng cookie" và cung cấp file cookies.txt hợp lệ. Bạn có thể lấy file này bằng tiện ích mở rộng trình duyệt như "Get cookies.txt (local)".`
              )
            )
          }

          // Thêm check cho lỗi HTTP 403 khi đang dùng cookie
          if (useCookieFile && fullStderr.toLowerCase().includes('http error 403')) {
            return reject(
              new Error(
                `Tải xuống thất bại (Lỗi 403: Bị cấm). Điều này thường xảy ra khi cookie bạn cung cấp không hợp lệ, đã hết hạn, hoặc không có quyền truy cập video này. Vui lòng thử xuất lại file cookie từ trình duyệt và thử lại.`
              )
            )
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
            // Nó không liên quan trực tiếp đến tùy chọn "Sử dụng cookie" bằng file của chúng ta.
            const helpfulError = new Error(
              'Tải xuống thất bại. Video có thể bị giới hạn độ tuổi hoặc riêng tư. Nếu không sử dụng file cookie, hãy đảm bảo bạn đã đăng nhập vào trang web trên trình duyệt được hỗ trợ (Chrome, Firefox, v.v.).'
            )
            return reject(helpfulError)
          }

          // For all other errors, use the stderr content.
          const errorMessage = fullStderr.trim() || `Download failed with exit code: ${code}.`
          reject(new Error(errorMessage))
        })

        subprocess.on('error', (error) => {
          log.error('[Video] Error executing yt-dlp process:', error)
          reject(new Error(`Lỗi khi thực thi tiến trình tải video: ${error.message}`))
        })
      })
    }
  )

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
}
