import { exec } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';

// ========== Configuration ==========
const CONFIG = {
  RENDERER_FOLDER: 'catalyst-web', // thư mục project web (nguồn)
  RENDERER_DEST_FOLDER: 'renderer', // thư mục đích mong muốn trong out
  DIST_FOLDER: 'dist',
  UNPACKED_FOLDER: 'win-unpacked',
  OUT_FOLDER: 'out',
};

// ========== Utilities ==========

/**
 * Executes a shell command and returns a Promise.
 * @param {string} command - The command to execute.
 * @returns {Promise<void>}
 */
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, { windowsHide: true }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Gets the appropriate file explorer command for the current platform.
 * @returns {string}
 */
function getOpenCommand() {
  if (process.platform === 'win32') return 'explorer';
  if (process.platform === 'darwin') return 'open';
  return 'xdg-open';
}

/**
 * Safely removes a directory if it exists.
 * @param {string} dirPath - Path to the directory.
 * @param {string} description - Description for logging.
 */
function removeDirectoryIfExists(dirPath, description) {
  if (existsSync(dirPath)) {
    console.warn(`Deleting ${description}: "${dirPath}"...`);
    rmSync(dirPath, { recursive: true, force: true });
    console.warn('Deletion successful.');
  } else {
    console.warn(`${description} does not exist. Skipping deletion.`);
  }
}

/**
 * Ensures a directory exists, creating it if necessary.
 * @param {string} dirPath - Path to the directory.
 */
function ensureDirectoryExists(dirPath) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Validates that a source path exists.
 * @param {string} sourcePath - Path to validate.
 * @throws {Error} If the path does not exist.
 */
function validateSourcePath(sourcePath) {
  if (!existsSync(sourcePath)) {
    const errorMsg = `Source directory "${sourcePath}" does not exist.`;
    console.error(`Error: ${errorMsg} Aborting script.`);
    throw new Error(errorMsg);
  }
}

// ========== Main Functions ==========

/**
 * Opens the dist folder in the system's file explorer.
 * @returns {Promise<void>}
 */
async function openDistFolder() {
  const cwd = process.cwd();
  const candidates = [
    resolve(cwd, CONFIG.DIST_FOLDER, CONFIG.UNPACKED_FOLDER), // dist/win-unpacked
    resolve(cwd, CONFIG.OUT_FOLDER, CONFIG.UNPACKED_FOLDER), // out/win-unpacked
    resolve(cwd, CONFIG.DIST_FOLDER), // dist
    resolve(cwd, CONFIG.OUT_FOLDER), // out
  ];

  const target = candidates.find((p) => existsSync(p));
  if (!target) {
    console.warn('Không tìm thấy thư mục output (dist/out). Bỏ qua mở.');
    return;
  }

  console.warn(`Opening: "${target}"`);
  const openCmd = getOpenCommand();

  try {
    await executeCommand(`${openCmd} "${target}"`);
    console.warn('Opened.');
  } catch (error) {
    console.error('Open failed:', error.message);
  }
}

/**
 * Copies the renderer build output to the native app's out folder.
 * @param {string} rendererFolder - Name of the renderer folder.
 */
function copyRendererOutput(rendererFolder, destFolder) {
  const currentDir = process.cwd();

  // Nguồn: ../nexo-web/dist
  const sourcePath = resolve(
    currentDir,
    '..',
    rendererFolder,
    CONFIG.DIST_FOLDER,
  );

  // Đích: out/renderer (không phải out/nexo-web nữa)
  const destinationPath = join(currentDir, CONFIG.OUT_FOLDER, destFolder);

  console.warn(`[Renderer] Replace to ${destFolder}...`);

  validateSourcePath(sourcePath);

  // XÓA TRƯỚC
  removeDirectoryIfExists(destinationPath, 'Destination directory');

  // Tạo lại
  ensureDirectoryExists(destinationPath);

  // Copy NỘI DUNG dist vào thẳng destination (không thêm lớp dist)
  console.warn(`Copying content of "${sourcePath}" -> "${destinationPath}"...`);
  cpSync(sourcePath, destinationPath, { recursive: true });
  console.warn('Copy successful.');
  console.warn('Renderer step done.');
}

// ========== Entry Point ==========

/**
 * Main build script execution.
 */
async function main() {
  try {
    const args = process.argv.slice(2);
    const rendererMode = args.includes('--renderer');

    if (rendererMode) {
      copyRendererOutput(CONFIG.RENDERER_FOLDER, CONFIG.RENDERER_DEST_FOLDER);
    }

    await openDistFolder();
  } catch (error) {
    console.error('An error occurred during script execution:', error);
    throw error;
  }
}

// Run the script
main();
