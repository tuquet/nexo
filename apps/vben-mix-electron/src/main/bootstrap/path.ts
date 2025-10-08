import { homedir } from 'node:os';
import path from 'node:path';

import { app } from 'electron';

import { APP_NAME } from '../config';

export const HOME_DIR = homedir();

export const APP_PATH = path.join(HOME_DIR, APP_NAME);
export const APP_UNPACKGED_PATH = path.join(
  app.getAppPath(),
  '..',
  'app.asar.unpacked',
);
export const APP_PROFILE_PATH = path.join(APP_PATH, 'profiles');
export const APP_DATA_PATH = path.join(APP_PATH, 'data');
