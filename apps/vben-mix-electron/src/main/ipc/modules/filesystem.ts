import fs from 'node:fs/promises';

import { IpcMain } from 'electron';
import log from 'electron-log';

/**
 * Registers IPC handlers for general filesystem operations.
 * @param ipc The IpcMain instance.
 */
export function filesystem(ipc: IpcMain): void {
  /**
   * Checks if a path exists on the filesystem.
   * Returns true if it exists, false otherwise.
   */
  ipc.handle('fs:path-exists', async (_, p: string) => {
    try {
      await fs.access(p);
      return true;
    } catch {
      return false;
    }
  });

  /**
   * Deletes a directory and all its contents.
   */
  ipc.handle('fs:delete-directory', async (_, dirPath: string) => {
    log.info(`[Filesystem] Received request to delete directory: ${dirPath}`);
    try {
      // Use fs.rm to delete the directory.
      // `recursive: true` is required to remove directories with content.
      // `force: true` prevents an error if the path doesn't exist.
      await fs.rm(dirPath, { recursive: true, force: true });
      log.info(`[Filesystem] Successfully deleted directory: ${dirPath}`);
    } catch (error: any) {
      log.error(`[Filesystem] Failed to delete directory ${dirPath}:`, error);
      throw new Error(`Không thể xóa thư mục: ${error.message}`);
    }
  });
}
