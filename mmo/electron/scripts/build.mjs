/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { existsSync, rmSync, cpSync, mkdirSync } from 'fs'
import { resolve, join } from 'path'
import { exec } from 'child_process'

// Get the flag from command-line arguments
const args = process.argv.slice(2)
const rendererMode = args.includes('--renderer')

/**
 * Opens the dist folder in the file explorer.
 */
function openDistFolder() {
  const distPath = resolve(process.cwd(), 'dist', 'win-unpacked')
  if (existsSync(distPath)) {
    console.log(`Opening directory "${distPath}"...`)
    const openCommand =
      process.platform === 'win32'
        ? 'start ""'
        : process.platform === 'darwin'
          ? 'open'
          : 'xdg-open'
    exec(`${openCommand} "${distPath}"`, (err) => {
      if (err) {
        console.error(`Error opening directory: ${err}`)
        process.exit(1)
      } else {
        console.log('Successfully opened.')
        process.exit(0)
      }
    })
  } else {
    console.log(`Directory "${distPath}" does not exist. Cannot open.`)
    process.exit(1)
  }
}

/**
 * Executes the renderer script to manage files.
 */
function rendererScript() {
  const currentDir = process.cwd()
  const outRendererPath = join(currentDir, 'out', 'renderer')
  const sourcePath = resolve(currentDir, '..', 'apps', 'web-antd', 'dist')
  const destinationPath = join(currentDir, 'out', 'renderer')

  if (!existsSync(sourcePath)) {
    console.error(
      `Error: Source directory "${sourcePath}" does not exist. Aborting postbuild script.`
    )
    process.exit(1)
  }

  if (existsSync(outRendererPath)) {
    console.log(`Deleting directory "${outRendererPath}"...`)
    rmSync(outRendererPath, { recursive: true, force: true })
    console.log('Deletion successful.')
  } else {
    console.log(`Directory "${outRendererPath}" does not exist. Skipping deletion.`)
  }

  if (!existsSync(destinationPath)) {
    mkdirSync(destinationPath, { recursive: true })
  }

  console.log(`Copying from "${sourcePath}" to "${destinationPath}"...`)
  cpSync(sourcePath, destinationPath, { recursive: true })
  console.log('Copy successful.')
  console.log('Postbuild script completed.')
}

try {
  if (rendererMode) {
    rendererScript()
    openDistFolder()
  } else {
    openDistFolder()
  }
} catch (error) {
  console.error('An error occurred during script execution:', error)
  process.exit(1)
}
