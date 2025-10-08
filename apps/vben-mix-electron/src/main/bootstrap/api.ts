import { APP_GITHUB_RELEASES_URL } from '../config';

export async function fetchReleases() {
  const response = await fetch(APP_GITHUB_RELEASES_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch releases: ${response.statusText}`);
  }
  return response.json();
}

export async function getLatestRelease() {
  const releases = await fetchReleases();
  if (releases.length > 0) {
    const latestRelease = releases[0];
    return {
      version: latestRelease.tag_name,
      releaseNotes: latestRelease.body || 'No release notes available.',
    };
  }
  throw new Error('No releases found.');
}
