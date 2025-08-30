import { IpcMain } from 'electron'
import path from 'node:path'
import youtubedl from 'youtube-dl-exec'
import log from 'electron-log'
import ffmpegPath from 'ffmpeg-static'
import { getMainWindow } from '../../process/window'

// Sửa đường dẫn ffmpeg để tương thích với ASAR packaging của Electron.
// Khi ứng dụng được đóng gói, các file thực thi cần nằm ngoài file asar.
const ffmpeg = ffmpegPath?.replace('app.asar', 'app.asar.unpacked')
export function youtube(ipc: IpcMain): void {
  /**
   * Lấy danh sách các định dạng video và audio có sẵn từ một URL YouTube.
   * Trả về một mảng các định dạng đã được xử lý để hiển thị trên giao diện người dùng.
   */
  ipc.handle('youtube:get-formats', async (_, videoUrl: string) => {
    log.info(`[YouTube] Fetching formats for URL: ${videoUrl}`)
    try {
      // Sử dụng --dump-single-json để lấy metadata của video mà không cần tải xuống
      const metadata = await youtubedl(videoUrl, {
        dumpSingleJson: true,
        noWarnings: true,
        callHome: false,
        noCheckCertificates: true
      })

      // Type guard để đảm bảo metadata là một đối tượng hợp lệ trước khi xử lý.
      if (typeof metadata === 'string' || !metadata) {
        throw new Error('Failed to parse video metadata.')
      }

      // Lọc và ánh xạ các định dạng sang một cấu trúc thân thiện hơn với frontend.
      const formats = metadata.formats
        .filter(
          (f) =>
            (f.resolution || (f.acodec && f.acodec !== 'none')) && // Phải có độ phân giải (video) hoặc có audio
            f.vcodec !== 'none' && // Loại bỏ các định dạng chỉ có audio trong danh sách này
            f.ext !== 'mhtml' // Loại bỏ các định dạng trang web
        )
        .map((f) => {
          const sizeMB = f.filesize || f.filesize_approx
          const sizeText = sizeMB ? `~${(sizeMB / 1024 / 1024).toFixed(1)} MB` : ''
          return {
            format_id: f.format_id,
            label: `${f.resolution} (${f.ext}) - ${f.format_note || 'Video'} ${sizeText}`.trim()
          }
        })

      log.info(`[YouTube] Found ${formats.length} suitable formats.`)
      return formats
    } catch (error: any) {
      log.error(`[YouTube] Error fetching formats for ${videoUrl}:`, error.message)
      throw new Error(`Failed to get video information: ${error.message}`)
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

      if (!ffmpeg) {
        log.error('[YouTube] FFmpeg not found. Merging files might fail.')
        throw new Error('FFmpeg not found. Cannot merge video and audio.')
      }

      // Sử dụng template của yt-dlp để tự động đặt tên file. `%(title)s` sẽ được thay thế bằng tiêu đề video.
      const outputTemplate = path.join(outputPath, '%(title)s.%(ext)s')
      log.info(`[YouTube] Output template: ${outputTemplate}`)

      // Use a promise to handle stream events
      return new Promise<void>((resolve, reject) => {
        const args: Parameters<typeof youtubedl.exec>[1] = {
          output: outputTemplate,
          noPlaylist: true,
          mergeOutputFormat: 'mp4',
          noWarnings: true,
          callHome: false,
          ffmpegLocation: ffmpeg,
          noCheckCertificates: true
        }

        if (isAudioOnly) {
          log.info('[YouTube] Audio only download requested. Setting format to mp3.')
          args.extractAudio = true
          args.audioFormat = 'mp3'
          args.format = 'bestaudio/best'
        } else if (formatCode) {
          log.info(`[YouTube] Using selected format code: ${formatCode}`)
          args.format = `${formatCode}+bestaudio/${formatCode}`
        } else {
          log.info('[YouTube] No format code selected, using default best quality.')
          args.format = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best'
        }

        const subprocess = youtubedl.exec(videoUrl, args)
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
          log.debug(`[YouTube] stdout: ${text.trim()}`)
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
          log.info(`[YouTube] Process finished with code: ${code}`)
          const fullStderr = stderrBuffer.join('')

          if (fullStderr.toLowerCase().includes('error:')) {
            return reject(new Error(fullStderr.trim()))
          }

          if (code === 0) {
            // Combine buffers and parse final path to handle race conditions
            const fullOutput = stdoutBuffer.join('') + fullStderr
            const destinationMatch = fullOutput.match(destinationRegex)
            const finalPath = destinationMatch ? destinationMatch[1] || destinationMatch[2] : null

            if (!finalPath) {
              // If the final path cannot be parsed, report an error.
              // This is better than sending an incorrect path to the user.
              return reject(
                new Error('Could not determine the path of the downloaded file from the output.')
              )
            }
            const resolvedPath = finalPath
            mainWindow.webContents.send('youtube:download-complete', {
              filePath: resolvedPath,
              key: videoUrl,
              title: videoTitle
            })
            resolve()
          } else {
            reject(
              new Error(
                `Video download process failed with exit code: ${code}. Please check the logs.`
              )
            )
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
