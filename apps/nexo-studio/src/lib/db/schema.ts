import type {
  WorkbenchProjectItem,
  WorkbenchQuickNavItem,
  WorkbenchTodoItem,
  WorkbenchTrendItem,
} from '@vben/common-ui';

/**
 * Định nghĩa lại kiểu dữ liệu để thêm `id` tự tăng
 */
export interface Project extends WorkbenchProjectItem {
  id?: number;
  groupId?: string;
  status?: string; // Trạng thái của project trên bảng Kanban (e.g., 'todo', 'doing', 'done')
  order?: number; // Thứ tự của project trong một cột Kanban
}

export interface QuickNav extends WorkbenchQuickNavItem {
  id?: number;
}

export interface Todo extends WorkbenchTodoItem {
  id?: number;
}

export interface Trend extends WorkbenchTrendItem {
  id?: number;
}

export interface Group {
  id: string;
  name: string;
  color?: string;
}

/**
 * Định nghĩa schema cho từng bảng.
 * '++id' là primary key tự tăng.
 * Các trường sau đó là các index để tăng tốc độ truy vấn.
 */
export const dbSchema = {
  groups: '&id, name', // '&id' nghĩa là id là unique, không tự tăng
  projects: '++id, title, groupId, status, order',
  quickNavs: '++id, title',
  todos: '++id, completed',
  trends: '++id, date',
};
