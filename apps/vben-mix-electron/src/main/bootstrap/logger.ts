import path from 'node:path';
import process from 'node:process';

import { app } from 'electron';
import log from 'electron-log';

import { APP_LOG_FILE_NAME } from '../config';
import { APP_PATH } from './path';

export function setupLogger(): void {
  // Ghi log vào thư mục dữ liệu của ứng dụng thay vì thư mục làm việc hiện tại
  // để đảm bảo vị trí nhất quán trên mọi môi trường.
  log.transports.file.resolvePathFn = () =>
    path.join(APP_PATH, 'logs', APP_LOG_FILE_NAME);

  // Xử lý các lỗi nghiêm trọng không thể phục hồi.
  // Ghi lại lỗi và thoát ứng dụng một cách an toàn.
  const handleFatalError = (error: Error | unknown): void => {
    app.quit();
    setTimeout(() => {
      throw error;
    }, 1000);
  };

  process.on('uncaughtException', handleFatalError);
  process.on('unhandledRejection', handleFatalError);
}
