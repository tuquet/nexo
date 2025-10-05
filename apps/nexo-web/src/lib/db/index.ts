import type { Table } from 'dexie';

import type { QuickNav, Todo, Trend } from './base-schema';
import type { ProjectTables } from './project-schema';
// Import các interface và schema mới
import type { PromptModuleTables } from './prompt-schema';

import Dexie from 'dexie';

import { baseSchema } from './base-schema';
import { projectSchema } from './project-schema';
import { promptSchema } from './prompt-schema';

// Kết hợp các interface của bảng
export class NexoStudioDexie extends Dexie {
  formats!: PromptModuleTables['formats'];
  groups!: ProjectTables['groups'];
  lengthOptions!: PromptModuleTables['lengthOptions'];
  outputRequirements!: PromptModuleTables['outputRequirements'];
  projects!: ProjectTables['projects'];
  promptHubs!: PromptModuleTables['promptHubs'];
  promptTags!: PromptModuleTables['promptTags'];
  promptTemplates!: PromptModuleTables['promptTemplates'];
  quickNavs!: Table<QuickNav, string>;
  scriptTypes!: PromptModuleTables['scriptTypes'];
  styles!: PromptModuleTables['styles'];
  tags!: PromptModuleTables['tags'];
  todos!: Table<Todo, string>;
  topics!: PromptModuleTables['topics'];
  trends!: Table<Trend, string>;
  userPrompts!: PromptModuleTables['userPrompts'];

  constructor() {
    super('NexoStudioDB'); // Đổi tên DB để bao quát hơn
    this.version(2).stores({
      ...baseSchema,
      ...projectSchema,
      ...promptSchema,
    });
  }
}

export const db = new NexoStudioDexie();
