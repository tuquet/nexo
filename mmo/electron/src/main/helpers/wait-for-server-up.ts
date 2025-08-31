import * as http from 'node:http'

export async function waitForServerUp(url: string) {
  console.log(`Waiting for server catalyst-frontend to be up at ${url}`)
  while (true) {
    const isUp = await isHostUp(url)
    if (isUp) break
    await wait(1000)
  }
}

const isHostUp = (url: string) =>
  new Promise((resolve) => http.get(url, () => resolve(true)).on('error', () => resolve(false)))

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
