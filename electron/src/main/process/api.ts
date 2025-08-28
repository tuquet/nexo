// Trả về danh sách các bản phát hành

export async function fetchReleases() {
  const response = await fetch('https://api.github.com/repos/tuquet/navigo/releases')
  if (!response.ok) {
    throw new Error(`Failed to fetch releases: ${response.statusText}`)
  }
  return response.json()
}

export async function getLatestRelease() {
  const releases = await fetchReleases()
  if (releases.length > 0) {
    const latestRelease = releases[0]
    return {
      version: latestRelease.tag_name,
      releaseNotes: latestRelease.body || 'No release notes available.'
    }
  }
  throw new Error('No releases found.')
}
