import { IpcMain } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'
import { spawn } from 'node:child_process'
import log from 'electron-log'
import { getMainWindow } from '../../bootstrap/window'
import { ensureBinaries } from '../../lib/binary-manager'

export function videoCutter(ipc: IpcMain): void {
  ipc.handle(
    'video:cut',
    async (
      _,
      {
        videoPath,
        outputPath,
        segmentDuration
      }: {
        videoPath: string
        outputPath: string
        segmentDuration: number
      }
    ) => {
      log.info('[VideoCutter] Starting video cutting process...')
      const mainWindow = getMainWindow()
      if (!mainWindow) {
        throw new Error('Main window not found.')
      }

      let ffmpegPath: string
      let ffprobePath: string

      try {
        // Bước 1: Đảm bảo ffmpeg và ffprobe có sẵn, tải nếu cần.
        log.info('[VideoCutter] Đang xác thực các công cụ cần thiết (FFmpeg/FFprobe)...')
        const binaries = await ensureBinaries()
        ffmpegPath = binaries.ffmpeg
        ffprobePath = binaries.ffprobe
        log.info(`[VideoCutter] Sử dụng ffmpeg tại: ${ffmpegPath}`)
        log.info(`[VideoCutter] Sử dụng ffprobe tại: ${ffprobePath}`)
      } catch (error: any) {
        log.error('[VideoCutter] Lỗi khi chuẩn bị các tệp nhị phân:', error)
        // BinaryManager đã gửi trạng thái chi tiết, ta chỉ cần throw lỗi để dừng.
        throw new Error(`Lỗi khi chuẩn bị công cụ video: ${error.message}`)
      }

      log.info(`[VideoCutter] Starting to cut video: ${videoPath}`)
      log.info(`[VideoCutter] Output directory: ${outputPath}`)

      try {
        await fs.mkdir(outputPath, { recursive: true })

        const getDuration = new Promise<string>((resolve, reject) => {
          const ffprobeProcess = spawn(ffprobePath, [
            '-v',
            'error',
            '-show_entries',
            'format=duration',
            '-of',
            'default=noprint_wrappers=1:nokey=1',
            videoPath
          ])

          let stdout = ''
          let stderr = ''

          ffprobeProcess.stdout.on('data', (data) => (stdout += data))
          ffprobeProcess.stderr.on('data', (data) => (stderr += data))

          ffprobeProcess.on('close', (code) => {
            if (code === 0) {
              resolve(stdout.trim())
            } else {
              log.error(`[VideoCutter] ffprobe failed with code ${code}: ${stderr}`)
              reject(new Error(`ffprobe failed with code ${code}: ${stderr}`))
            }
          })
          ffprobeProcess.on('error', reject)
        })

        const durationStdout = await getDuration
        const totalDuration = parseFloat(durationStdout)

        if (isNaN(totalDuration)) {
          log.error(
            `[VideoCutter] Could not parse video duration from ffprobe output: "${durationStdout}"`
          )
          throw new Error('Could not get video duration.')
        }

        const totalSegments = Math.ceil(totalDuration / segmentDuration)
        log.info(
          `[VideoCutter] Total duration: ${totalDuration}s, Segments to create: ${totalSegments}`
        )

        const outputPattern = path.join(outputPath, '%d.mp4')
        const ffmpegArgs = [
          '-i',
          videoPath,
          '-c',
          'copy',
          '-map',
          '0',
          '-segment_time',
          segmentDuration.toString(),
          '-f',
          'segment',
          '-reset_timestamps',
          '1',
          '-segment_start_number',
          '1',
          outputPattern
        ]

        const child = spawn(ffmpegPath, ffmpegArgs)
        const stderrBuffer: string[] = []

        let segmentsDone = 0
        child.stderr?.on('data', (data: Buffer) => {
          const text = data.toString()
          stderrBuffer.push(text)
          // Count how many times a new file is created to estimate progress
          if (text.includes('Opening') && text.includes('for writing')) {
            segmentsDone++
            const percent = Math.min(99, Math.round((segmentsDone / totalSegments) * 100))
            mainWindow.webContents.send('video-cutter:progress', {
              percent,
              message: `Đang xử lý phân đoạn ${segmentsDone} của ${totalSegments}...`
            })
          }
        })

        return new Promise<void>((resolve, reject) => {
          child.on('close', (code) => {
            if (code === 0) {
              log.info(
                `[VideoCutter] Video cutting completed successfully. ${totalSegments} segments created in '${outputPath}'.`
              )
              resolve()
            } else {
              const fullError = stderrBuffer.join('')
              const cleanError =
                fullError
                  .split('\n')
                  .filter((line) => line.trim())
                  .pop() || `FFmpeg process exited with code ${code}`
              log.error(`[VideoCutter] FFmpeg failed. Full error: ${fullError}`)
              reject(new Error(cleanError))
            }
          })
          child.on('error', (err) => reject(err))
        })
      } catch (error) {
        log.error('[VideoCutter] Error:', error)
        throw error
      }
    }
  )
}
