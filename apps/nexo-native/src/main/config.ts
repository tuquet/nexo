import * as process from 'node:process';

const env = (import.meta as any).env ?? process.env;

function read(key: string, fallback: string): string {
  return env[key] || fallback;
}

export const APP_GITHUB_RELEASES_URL = read(
  'MAIN_VITE_GITHUB_RELEASES_URL',
  'https://api.github.com/repos/tuquet/nexo/releases',
);

export const APP_OAUTH_PROTOCOL_KEY = read(
  'MAIN_VITE_OAUTH_PROTOCOL_KEY',
  'oauth-singin-events',
);

export const APP_NAME = read('MAIN_VITE_APP_NAME', 'nexo');

export const APP_MODEL_ID = read(
  'MAIN_VITE_APP_MODEL_ID',
  'vn.tfsoftware.nexo',
);

export const APP_DEV_RENDERER_URL = read(
  'MAIN_VITE_DEV_RENDERER_URL',
  'http://localhost:5668',
);

export const APP_LOG_FILE_NAME = read('MAIN_VITE_LOG_FILE_NAME', 'main.log');
