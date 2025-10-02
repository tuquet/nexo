import type { Table } from 'dexie';

import type { Group, Project, QuickNav, Todo, Trend } from './schema';

import Dexie from 'dexie';

import { dbSchema } from './schema';

/**
 * Lớp quản lý database Dexie
 */
export class NexoStudioDexie extends Dexie {
  // Khai báo các bảng (table) sẽ có trong database
  // TypeScript sẽ hiểu kiểu dữ liệu của từng bảng
  groups!: Table<Group>;
  projects!: Table<Project>;
  quickNavs!: Table<QuickNav>;
  todos!: Table<Todo>;
  trends!: Table<Trend>;

  constructor() {
    // Tên của database
    super('nexoStudioDatabase');
    this.version(1).stores(dbSchema);
  }
}

// Khởi tạo và export một instance duy nhất để sử dụng trong toàn bộ ứng dụng
export const db = new NexoStudioDexie();
