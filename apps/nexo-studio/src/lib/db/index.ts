import type { Table } from 'dexie';

import type { QuickNav, Todo, Trend } from './base-schema';
import type { ProjectTables } from './project-schema';
// Import các interface và schema mới
import type { PromptVideoMakerTables } from './prompt-schema';

import Dexie from 'dexie';

import { baseSchema } from './base-schema';
import { projectSchema } from './project-schema';
import { promptVideoMakerSchema } from './prompt-schema';

// Kết hợp các interface của bảng
export class NexoStudioDexie extends Dexie {
  formats!: PromptVideoMakerTables['formats'];
  groups!: ProjectTables['groups'];
  lengthOptions!: PromptVideoMakerTables['lengthOptions'];
  outputRequirements!: PromptVideoMakerTables['outputRequirements'];
  projects!: ProjectTables['projects'];
  promptTemplates!: PromptVideoMakerTables['promptTemplates'];
  quickNavs!: Table<QuickNav, string>;
  scriptTypes!: PromptVideoMakerTables['scriptTypes'];
  styles!: PromptVideoMakerTables['styles'];
  todos!: Table<Todo, string>;
  topics!: PromptVideoMakerTables['topics'];
  trends!: Table<Trend, string>;
  userPrompts!: PromptVideoMakerTables['userPrompts'];

  constructor() {
    super('NexoStudioDB'); // Đổi tên DB để bao quát hơn
    this.version(2).stores({
      ...baseSchema,
      ...projectSchema,
      ...promptVideoMakerSchema,
    });
  }
}

export const db = new NexoStudioDexie();
