import { IpcMain } from 'electron'
import path from 'node:path'
import { spawn } from 'node:child_process'
import log from 'electron-log'
import { getMainWindow } from '../../bootstrap/window'
import { ensureBinaries } from '../../lib/binary-manager'
import { ensureYtDlp } from '../../lib/yt-dlp-manager'

export function youtube(ipc: IpcMain): void {
  /**
   * Lấy danh sách các định dạng video và audio có sẵn từ một URL YouTube.
   * Trả về một mảng các định dạng đã được xử lý để hiển thị trên giao diện người dùng.
   */
  ipc.handle('youtube:get-formats', async (_, videoUrl: string) => {
    log.info(`[YouTube] Fetching formats for URL: ${videoUrl}`)
    try {
      const ytdlpPath = await ensureYtDlp()
      log.info(`[YouTube] Using yt-dlp at: ${ytdlpPath}`)

      const args = [videoUrl, '--dump-single-json', '--no-warnings', '--no-call-home']

      const process = spawn(ytdlpPath, args)

      let stdoutData = ''
      let stderrData = ''
      process.stdout.on('data', (data) => (stdoutData += data.toString()))
      process.stderr.on('data', (data) => (stderrData += data.toString()))

      return new Promise((resolve, reject) => {
        process.on('close', (code) => {
          if (code === 0) {
            try {
              const metadata = JSON.parse(stdoutData)

              if (typeof metadata === 'string' || !metadata) {
                throw new Error('Failed to parse video metadata.')
              }

              const formats = metadata.formats
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

              log.info(`[YouTube] Found ${formats.length} suitable formats.`)
              resolve(formats)
            } catch (e) {
              log.error(
                '[YouTube] Failed to parse yt-dlp JSON output:',
                e,
                'Raw output:',
                stdoutData
              )
              reject(new Error('Failed to parse video metadata.'))
            }
          } else {
            log.error(`[YouTube] yt-dlp exited with code ${code}. Stderr: ${stderrData}`)
            reject(new Error(`Failed to get video information: ${stderrData}`))
          }
        })
        process.on('error', (err) => {
          log.error('[YouTube] Failed to spawn yt-dlp process:', err)
          reject(err)
        })
      })
    } catch (error: any) {
      // Log toàn bộ đối tượng lỗi để có thêm thông tin, vì 'error.message' có thể trống.
      // Đặc biệt là các lỗi liên quan đến process spawn (ENOENT).
      log.error(`[YouTube] Error fetching formats for ${videoUrl}:`, error)
      const errorMessage = error.stderr || error.message || 'Unknown error'
      throw new Error(`Failed to get video information: ${errorMessage}`)
    }
  })

  ipc.handle(
    'youtube:download-video',
    async (
      _,
      {
        videoUrl,
        outputPath,
        formatCode,
        isAudioOnly
      }: { videoUrl: string; outputPath: string; formatCode?: string; isAudioOnly?: boolean }
    ) => {
      const mainWindow = getMainWindow()
      log.info(`[YouTube] Starting video download from URL: ${videoUrl}`)
      if (!mainWindow) {
        log.error('[YouTube] Main window not found.')
        throw new Error('Main window does not exist.')
      }

      let ffmpegPath: string, ytdlpPath: string
      try {
        log.info('[YouTube] Verifying required binaries (FFmpeg & yt-dlp)...')
        const [binaries, ytdlp] = await Promise.all([ensureBinaries(), ensureYtDlp()])
        ffmpegPath = binaries.ffmpeg
        ytdlpPath = ytdlp
        log.info(`[YouTube] Using ffmpeg at: ${ffmpegPath}`)
        log.info(`[YouTube] Using yt-dlp at: ${ytdlpPath}`)
      } catch (error: any) {
        log.error('[YouTube] Failed to get required binaries:', error)
        throw new Error(`Failed to prepare tools: ${error.message}`)
      }

      // Sử dụng template của yt-dlp để tự động đặt tên file. `%(title)s` sẽ được thay thế bằng tiêu đề video.
      const outputTemplate = path.join(outputPath, '%(title)s.%(ext)s')
      log.info(`[YouTube] Output template: ${outputTemplate}`)

      return new Promise<void>((resolve, reject) => {
        const args: string[] = [
          videoUrl,
          '--output',
          outputTemplate,
          '--no-playlist',
          '--merge-output-format',
          'mp4',
          '--no-warnings',
          '--no-call-home',
          '--ffmpeg-location',
          ffmpegPath,
          '--no-check-certificates'
        ]

        if (isAudioOnly) {
          log.info('[YouTube] Audio only download requested. Setting format to mp3.')
          args.push('--extract-audio', '--audio-format', 'mp3', '--format', 'bestaudio/best')
        } else if (formatCode) {
          log.info(`[YouTube] Using selected format code: ${formatCode}`)
          args.push('--format', `${formatCode}+bestaudio/${formatCode}`)
        } else {
          log.info('[YouTube] No format code selected, using default best quality.')
          args.push('--format', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best')
        }

        const subprocess = spawn(ytdlpPath, args)
        log.info('[YouTube] yt-dlp process started.')

        // Regex to parse progress from yt-dlp output
        const progressRegex = /\[download\]\s+([\d.]+)%/
        // Regex to find the final output file path from yt-dlp's stdout
        const destinationRegex =
          /\[(?:Merger|download)\] Merging formats into "([^"]+)"|\[download\] Destination:\s(.+)/
        // Regex to find the video title
        const titleRegex = /\[info\] Title:\s(.+)/
        let videoTitle: string | null = null
        const stdoutBuffer: string[] = []
        const stderrBuffer: string[] = []
        let fileAlreadyDownloaded = false // Flag to detect the specific case

        const handleDataChunk = (text: string): void => {
          // yt-dlp can output multiple progress lines in a single data chunk.
          // We find all of them and use the last one for the most up-to-date percentage.
          const allProgressMatches = text.match(new RegExp(progressRegex, 'g'))
          if (allProgressMatches) {
            const lastMatchText = allProgressMatches[allProgressMatches.length - 1]
            const progressMatch = lastMatchText.match(progressRegex) // Re-match to get capture groups
            if (progressMatch && progressMatch[1]) {
              const percent = parseFloat(progressMatch[1])
              mainWindow.webContents.send('youtube:download-progress', {
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
              mainWindow.webContents.send('youtube:download-started', {
                key: videoUrl,
                title: videoTitle
              })
            }
          }
        }

        subprocess.stdout?.on('data', (data) => {
          const text = data.toString() // Convert buffer to string
          // Check for the specific "already downloaded" message
          if (text.includes('has already been downloaded')) {
            fileAlreadyDownloaded = true
            // Log this specific message as an error, as requested
            log.error(`[YouTube] Download skipped: ${text.trim()}`)
          } else {
            // Log other stdout messages as debug
            log.verbose(`[YouTube] stdout: ${text.trim()}`)
          }
          stdoutBuffer.push(text)
          handleDataChunk(text)
        })

        subprocess.stderr?.on('data', (data) => {
          const text = data.toString()
          log.error(`[YouTube] stderr: ${text.trim()}`)
          stderrBuffer.push(text)
          // yt-dlp often prints progress to stderr, so we parse it here too
          handleDataChunk(text)
        })

        subprocess.on('close', (code) => {
          const fullStderr = stderrBuffer.join('')

          // If we detected the file was already downloaded, reject the promise
          // even if the exit code is 0.
          if (fileAlreadyDownloaded) {
            return reject(
              new Error('File has already been downloaded and exists in the output folder.')
            )
          }

          if (fullStderr.toLowerCase().includes('error:')) {
            return reject(new Error(fullStderr.trim()))
          }

          if (code === 0) {
            // Combine buffers and parse final path to handle race conditions
            const fullOutput = stdoutBuffer.join('') + fullStderr
            const destinationMatch = fullOutput.match(destinationRegex)
            const finalPath = destinationMatch ? destinationMatch[1] || destinationMatch[2] : null

            if (finalPath) {
              log.info(`[YouTube] Download successful. Title: ${videoTitle}, Path: ${finalPath}`)
            } else {
              // If the final path cannot be parsed, log an error and reject.
              log.error(
                '[YouTube] Download process finished, but could not parse final file path from output.'
              )
              return reject(new Error('Could not determine the path of the downloaded file.'))
            }
            const resolvedPath = finalPath
            mainWindow.webContents.send('youtube:download-complete', {
              filePath: resolvedPath,
              key: videoUrl,
              title: videoTitle
            })
            resolve()
          } else {
            log.error(`[YouTube] Process exited with non-zero code: ${code}. Stderr: ${fullStderr}`)
            reject(new Error(`Download failed with exit code: ${code}. Please check the logs.`))
          }
        })

        subprocess.on('error', (error) => {
          log.error('[YouTube] Error executing yt-dlp process:', error)
          reject(new Error(`Error executing youtube-dl: ${error.message}`))
        })
      })
    }
  )
}
