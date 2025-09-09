function log(message) {
  const timestamp = new Date().toISOString()
  console.log(`${timestamp} - ${message}`)
}

log('Hello from Demo Server! Process started.')
log(`Working directory: ${process.cwd()}`)

// const intervalId = setInterval(() => {
// log('Ping from child process.')
// }, 3000)

process.on('message', (msg) => {
  if (msg === 'shutdown') {
    log('Shutdown signal received. Exiting gracefully.')
    // clearInterval(intervalId)
    process.exit(0)
  }
})
