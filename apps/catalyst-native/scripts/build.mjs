import { exec } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';

const args = process.argv.slice(2);
const rendererMode = args.includes('--renderer');

/**
 * Opens the dist folder in the file explorer.
 */
function openDistFolder() {
  const distPath = resolve(process.cwd(), 'dist', 'win-unpacked');
  if (existsSync(distPath)) {
    console.warn(`Opening directory "${distPath}"...`);
    let openCommand = 'xdg-open';
    if (process.platform === 'win32') {
      openCommand = 'start ""';
    } else if (process.platform === 'darwin') {
      openCommand = 'open';
    }
    exec(`${openCommand} "${distPath}"`, (err) => {
      if (err) {
        console.error(`Error opening directory: ${err}`);
        throw new Error(`Error opening directory: ${err}`);
      } else {
        console.warn('Successfully opened.');
      }
    });
  }
}

function rendererScript() {
  const currentDir = process.cwd();
  const outRendererPath = join(currentDir, 'out', 'renderer');
  const sourcePath = resolve(currentDir, '..', 'renderer', 'dist');
  const destinationPath = join(currentDir, 'out', 'renderer');

  if (!existsSync(sourcePath)) {
    console.error(
      `Error: Source directory "${sourcePath}" does not exist. Aborting postbuild script.`,
    );
    throw new Error(`Source directory "${sourcePath}" does not exist.`);
  }

  if (existsSync(outRendererPath)) {
    console.warn(`Deleting directory "${outRendererPath}"...`);
    rmSync(outRendererPath, { recursive: true, force: true });
    console.warn('Deletion successful.');
  } else {
    console.warn(
      `Directory "${outRendererPath}" does not exist. Skipping deletion.`,
    );
  }

  if (!existsSync(destinationPath)) {
    mkdirSync(destinationPath, { recursive: true });
  }

  console.warn(`Copying from "${sourcePath}" to "${destinationPath}"...`);
  cpSync(sourcePath, destinationPath, { recursive: true });
  console.warn('Copy successful.');
  console.warn('Postbuild script completed.');
}

try {
  if (rendererMode) {
    rendererScript();
  }
  openDistFolder();
} catch (error) {
  console.error('An error occurred during script execution:', error);
  throw error;
}
