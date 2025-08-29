import { existsSync, rmSync, cpSync, mkdirSync } from 'fs'
import { resolve, join } from 'path'

// Get the flag from command-line arguments
const args = process.argv.slice(2)

const disabled = args.includes('--disable')

if (disabled) {
  console.log('Postbuild script is disabled. Exiting.')
  process.exit(0)
}

// Get the current working directory
const currentDir = process.cwd()
// console.log(`Current working directory: ${currentDir}`)

// Define paths
const outRendererPath = join(currentDir, 'out', 'renderer')
const sourcePath = resolve(currentDir, '..', 'apps', 'web-antd', 'dist')
const destinationPath = join(currentDir, 'out', 'renderer')

// Log the paths for debugging
// console.log(`Source directory path: ${sourcePath}`)
// console.log(`Destination directory path: ${destinationPath}`)

try {
  // Add a check to ensure the source directory exists
  if (!existsSync(sourcePath)) {
    console.error(
      `Error: Source directory "${sourcePath}" does not exist. Aborting postbuild script.`
    )
    process.exit(1)
  }

  // Step 1: Remove the existing out/renderer folder
  if (existsSync(outRendererPath)) {
    console.log(`Deleting directory "${outRendererPath}"...`)
    rmSync(outRendererPath, { recursive: true, force: true })
    console.log('Deletion successful.')
  } else {
    console.log(`Directory "${outRendererPath}" does not exist. Skipping deletion.`)
  }

  // Create the destination directory if it doesn't exist
  if (!existsSync(destinationPath)) {
    mkdirSync(destinationPath, { recursive: true })
  }

  // Step 2: Copy the new folder
  console.log(`Copying from "${sourcePath}" to "${destinationPath}"...`)
  cpSync(sourcePath, destinationPath, { recursive: true })
  console.log('Copy successful.')
  console.log('Postbuild script completed.')
} catch (error) {
  console.error('An error occurred during postbuild:', error)
  process.exit(1)
}
