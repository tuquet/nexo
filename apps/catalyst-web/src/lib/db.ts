import type { Table } from 'dexie';

import type { ScriptJob } from '#/views/features/ai-script-writer/ai-script-writer.data';

import Dexie from 'dexie';

export class MMODatabase extends Dexie {
  scriptJobs!: Table<ScriptJob, string>; // The key is a string

  constructor() {
    super('MMOToolsDatabase');
    this.version(1).stores({
      scriptJobs: '&id, createdAt', // Primary key '&id' and index 'createdAt'
    });
  }
}

export const db = new MMODatabase();
