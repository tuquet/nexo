import type { Table } from 'dexie';

import type { WorkbenchProjectItem } from '@vben/common-ui';

/**
 * Định nghĩa lại kiểu dữ liệu để thêm `id` tự tăng
 */
export interface Project extends WorkbenchProjectItem {
  id?: number;
  groupId?: string;
  status?: ProjectStatus; // Trạng thái của project trên bảng Kanban (e.g., 'todo', 'doing', 'done')
  order?: number; // Thứ tự của project trong một cột Kanban
}

export interface Group {
  id: string;
  name: string;
  color?: string;
}

export type ProjectStatus =
  | 'cancelled'
  | 'completed'
  | 'in-progress'
  | 'on-hold'
  | 'planning';

export interface ProjectTables {
  groups: Table<Group, string>;
  projects: Table<Project, number>;
}

export const projectSchema = {
  groups: '&id, name',
  projects: '++id, date, title, groupId, status, order',
};
