import { IpcMain } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'
import { spawn } from 'node:child_process'
import log from 'electron-log'
import ffmpegPath from 'ffmpeg-static'
import { path as ffprobePath } from 'ffprobe-static'
import { is } from '@electron-toolkit/utils'
import { getMainWindow } from '../../bootstrap/window'

// Correct paths for ASAR packaging
const ffmpeg = is.dev ? ffmpegPath : ffmpegPath?.replace('app.asar', 'app.asar.unpacked')
const ffprobe = is.dev ? ffprobePath : ffprobePath?.replace('app.asar', 'app.asar.unpacked')

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
      if (!ffmpeg || !ffprobe) {
        throw new Error('FFmpeg/FFprobe not found.')
      }

      log.info(`[VideoCutter] Starting to cut video: ${videoPath}`)
      log.info(`[VideoCutter] Output directory: ${outputPath}`)

      try {
        // 1. Create output directory if it doesn't exist
        await fs.mkdir(outputPath, { recursive: true })

        // 2. Get video duration with ffprobe, using spawn for safety with special characters in paths
        const getDuration = new Promise<string>((resolve, reject) => {
          const ffprobeProcess = spawn(ffprobe, [
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

        // 3. Execute ffmpeg command to cut the video, using spawn to avoid shell issues
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

        const child = spawn(ffmpeg, ffmpegArgs)
        const stderrBuffer: string[] = []

        // FFmpeg writes progress to stderr, we will parse it
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
              message: `Processing segment ${segmentsDone} of ${totalSegments}...`
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
        throw error // Throw error so the renderer process can catch it
      }
    }
  )
}
