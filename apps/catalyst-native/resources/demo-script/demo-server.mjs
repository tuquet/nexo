import log from 'electron-log'

process.on('message', (msg) => {
  if (msg === 'shutdown') {
    log.info('[Demo Server] Shutdown signal received. Exiting gracefully.')
    process.exit(0)
  }
})
