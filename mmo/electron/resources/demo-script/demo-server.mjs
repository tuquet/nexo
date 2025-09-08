import fs from 'node:fs'
import path from 'node:path'

const logFilePath = path.join(process.cwd(), 'demo-server-log.txt')

function log(message) {
  const timestamp = new Date().toISOString()
  const logMessage = `${timestamp} - ${message}\n`
  console.log(logMessage.trim())
  fs.appendFileSync(logFilePath, logMessage)
}

log('Hello from Demo Server! Process started.')
log(`Working directory: ${process.cwd()}`)

const intervalId = setInterval(() => {
  log('Ping from child process.')
}, 3000)

process.on('message', (msg) => {
  if (msg === 'shutdown') {
    log('Shutdown signal received. Exiting gracefully.')
    clearInterval(intervalId)
    process.exit(0)
  }
})
