import { ChildProcess, spawn } from 'child_process'
import { join } from 'node:path'
import process from 'node:process'
import fs from 'node:fs'

import { is } from '@electron-toolkit/utils'
import log from 'electron-log'

let mockServerProcess: ChildProcess | null = null

/**
 * Starts the mock backend server as a child process.
 * It determines the correct path for both development and production environments.
 */
export function startMockServer(): void {
  // Tạm thời trỏ đến file demo để kiểm tra
  const serverEntryPoint = 'demo-script/demo-server.mjs'

  // The path to the resources directory differs between dev and prod.
  // In dev, we navigate from the current file's location.
  // In prod, `process.resourcesPath` points to the correct directory.
  const serverPath = is.dev
    ? join(__dirname, '..', '..', 'resources', serverEntryPoint)
    : join(process.resourcesPath, serverEntryPoint)

  // Add a check to see if the file exists for easier debugging.
  if (!fs.existsSync(serverPath)) {
    log.error(`[Mock Server] Script file not found at path: ${serverPath}`)
    log.error(
      `[Mock Server] Please ensure the 'demo-script' folder is placed in 'mmo/electron/resources' and is being copied during the build process.`
    )
    return
  }

  try {
    // Chúng ta sử dụng `spawn` thay vì `fork` ở đây để có thể truy cập tùy chọn
    // `windowsHide`, vốn không có trong định nghĩa kiểu của `fork`. Điều này
    // ngăn cửa sổ console của mock server xuất hiện trên Windows trong quá trình
    // phát triển.
    // Tùy chọn `stdio` sao chép lại hành vi của `fork` với `silent: true`.
    mockServerProcess = spawn(process.execPath, [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      windowsHide: true,
      env: { ...process.env }
    })

    mockServerProcess.on('spawn', () => {
      log.info(`[Mock Server] Process spawned successfully. PID: ${mockServerProcess?.pid}`)
    })

    mockServerProcess.stdout?.on('data', (data) => {
      log.info(`[Mock Server] stdout: ${data.toString().trim()}`)
    })

    mockServerProcess.stderr?.on('data', (data) => {
      log.error(`[Mock Server] stderr: ${data.toString().trim()}`)
    })

    mockServerProcess.on('error', (err) => {
      log.error('[Mock Server] Failed to start process:', err)
    })

    mockServerProcess.on('exit', (code, signal) => {
      log.warn(`[Mock Server] Process exited with code: ${code}, signal: ${signal}`)
      mockServerProcess = null
    })
  } catch (error) {
    log.error('[Mock Server] Error forking process:', error)
  }
}

/**
 * Stops the mock backend server process if it is running.
 */
export function stopMockServer(): void {
  if (mockServerProcess && !mockServerProcess.killed) {
    log.info('[Mock Server] Sending shutdown signal to child process...')
    // Gửi một tin nhắn để tiến trình con tự tắt một cách an toàn
    mockServerProcess.send('shutdown')

    // Đợi một chút trước khi buộc phải tắt nếu nó không phản hồi
    setTimeout(() => {
      if (mockServerProcess && !mockServerProcess.killed) {
        mockServerProcess.kill('SIGKILL')
      }
    }, 2000)

    mockServerProcess = null
  }
}
