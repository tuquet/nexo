import type { ChildProcess } from 'node:child_process';

import { Buffer } from 'node:buffer';
import { exec, spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { IpcMain } from 'electron';
import log from 'electron-log';

import { getMainWindow } from '../../bootstrap/window';
import { ensureBinaries } from '../../lib/binary-manager';

// Map để lưu trữ các tiến trình cắt đang hoạt động
const activeCuts = new Map<string, ChildProcess>();

// Set để theo dõi các tác vụ đã bị người dùng hủy
const canceledCuts = new Set<string>();

export function videoCutter(ipc: IpcMain): void {
  ipc.handle(
    'video:cut',
    async (
      _,
      {
        videoPath,
        jobId,
        outputPath,
        segmentDuration,
      }: {
        jobId: string;
        outputPath: string;
        segmentDuration: number;
        videoPath: string;
      },
    ) => {
      // Xóa trạng thái hủy cũ khi bắt đầu lại
      canceledCuts.delete(jobId);

      log.info(
        `[VideoCutter] Starting video cutting process for job: ${jobId}...`,
      );
      const mainWindow = getMainWindow();
      if (!mainWindow) {
        throw new Error('Main window not found.');
      }

      let ffmpegPath: string;
      let ffprobePath: string;

      try {
        // Bước 1: Đảm bảo ffmpeg và ffprobe có sẵn
        log.info(
          '[VideoCutter] Verifying required binaries (FFmpeg/FFprobe)...',
        );
        const binaries = await ensureBinaries(); // Remove the argument
        ffmpegPath = binaries.ffmpeg;
        ffprobePath = binaries.ffprobe;
        log.info(`[VideoCutter] Sử dụng ffmpeg tại: ${ffmpegPath}`);
        log.info(`[VideoCutter] Sử dụng ffprobe tại: ${ffprobePath}`);
      } catch (error: any) {
        log.error('[VideoCutter] Failed to get required binaries:', error);
        // BinaryManager đã gửi trạng thái chi tiết, ta chỉ cần throw lỗi để dừng.
        throw new Error(`Failed to prepare tools: ${error.message}`);
      }

      log.info(`[VideoCutter] Starting to cut video: ${videoPath}`);
      log.info(`[VideoCutter] Output directory: ${outputPath}`);

      try {
        await fs.mkdir(outputPath, { recursive: true });

        // Bước 1: Lấy thời lượng video bằng ffprobe để tính tiến trình
        const getDuration = new Promise<string>((resolve, reject) => {
          const ffprobeProcess = spawn(ffprobePath, [
            '-v',
            'error',
            '-show_entries',
            'format=duration',
            '-of',
            'default=noprint_wrappers=1:nokey=1',
            videoPath,
          ]);
          let stdout = '';
          ffprobeProcess.stdout.on('data', (data) => (stdout += data));
          ffprobeProcess.on('close', (code) =>
            code === 0
              ? resolve(stdout.trim())
              : reject(new Error('ffprobe failed')),
          );
          ffprobeProcess.on('error', reject);
        });

        const durationStdout = await getDuration;
        const totalDuration = Number.parseFloat(durationStdout);
        if (Number.isNaN(totalDuration)) {
          throw new TypeError('Could not get video duration.');
        }
        const totalSegments = Math.ceil(totalDuration / segmentDuration);
        log.info(
          `[VideoCutter] Total duration: ${totalDuration}s, Segments to create: ~${totalSegments}`,
        );

        // Bước 2: Bắt đầu tiến trình cắt video
        const outputPattern = path.join(outputPath, 'output-%03d.mp4');
        const ffmpegArgs = ['-i', videoPath];

        // Luôn sử dụng chế độ cắt chính xác (mã hóa lại và ép keyframe).
        log.info(
          '[VideoCutter] Using precise cut mode (re-encoding with forced keyframes).',
        );
        ffmpegArgs.push(
          '-force_key_frames',
          `expr:gte(t,n_forced*${segmentDuration})`,
          // Các tham số segment cốt lõi
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
          outputPattern,
        );

        const child = spawn(ffmpegPath, ffmpegArgs, {
          detached: process.platform !== 'win32',
          windowsHide: true,
        });
        activeCuts.set(jobId, child);

        const stderrBuffer: string[] = [];
        let segmentsDone = 0;

        child.stderr?.on('data', (data: Buffer) => {
          const text = data.toString();
          stderrBuffer.push(text);
          // Đếm số lần ffmpeg mở file mới để ghi để ước tính tiến trình
          if (text.includes('Opening') && text.includes('for writing')) {
            segmentsDone++;
            const percent = Math.min(
              100,
              Math.round((segmentsDone / totalSegments) * 100),
            );
            mainWindow.webContents.send('video-cutter:progress', {
              jobId,
              percent,
            });
          }
        });

        return new Promise<void>((resolve, reject) => {
          child.on('close', (code) => {
            activeCuts.delete(jobId);

            if (canceledCuts.has(jobId)) {
              canceledCuts.delete(jobId);
              log.info(`[VideoCutter] Job ${jobId} was canceled by user.`);
              return reject(
                new Error('CUT_CANCELED: Tác vụ đã bị người dùng dừng lại.'),
              );
            }

            if (code === 0) {
              log.info(`[VideoCutter] Job ${jobId} completed successfully.`);
              resolve();
            } else {
              const fullError = stderrBuffer.join('');
              // Cố gắng tìm dòng lỗi cuối cùng có ý nghĩa
              const cleanError =
                fullError
                  .split('\n')
                  .findLast(
                    (line) =>
                      line.trim() && line.toLowerCase().includes('error'),
                  ) || `FFmpeg process exited with code ${code}`;

              log.error(
                `[VideoCutter] Job ${jobId} failed. Full error: ${fullError}`,
              );

              reject(new Error(cleanError));
            }
          });
          child.on('error', (err) => {
            activeCuts.delete(jobId);
            reject(err);
          });
        });
      } catch (error) {
        log.error(`[VideoCutter] Error in job ${jobId}:`, error);
        throw error;
      }
    },
  );

  // Thêm handler để dừng tác vụ cắt
  ipc.handle('video:stop-cut', async (_, jobId: string) => {
    const subprocess = activeCuts.get(jobId);
    if (subprocess && subprocess.pid) {
      const pid = subprocess.pid;
      log.info(
        `[VideoCutter] Received request to stop cut for job: ${jobId}, PID: ${pid}`,
      );
      canceledCuts.add(jobId);

      if (process.platform === 'win32') {
        exec(`taskkill /PID ${pid} /T /F`, { windowsHide: true }, (err) => {
          if (err) {
            log.warn(
              `[VideoCutter] taskkill for PID ${pid} failed:`,
              err.message,
            );
          } else {
            log.info(
              `[VideoCutter] Successfully issued taskkill for process tree of PID ${pid}.`,
            );
          }
        });
      } else {
        try {
          // Trên macOS/Linux, kill process group bằng PID âm
          process.kill(-pid, 'SIGKILL');
          log.info(
            `[VideoCutter] Successfully sent SIGKILL to process group -${pid}.`,
          );
        } catch (error: any) {
          log.warn(
            `[VideoCutter] process.kill for group -${pid} failed:`,
            error.message,
          );
        }
      }
      return { success: true };
    }
    log.warn(`[VideoCutter] Stop request for non-existent cut job: ${jobId}`);
    return { success: false, message: 'Không tìm thấy tiến trình.' };
  });
}
