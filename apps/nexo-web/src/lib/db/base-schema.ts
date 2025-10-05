import type {
  WorkbenchQuickNavItem,
  WorkbenchTodoItem,
  WorkbenchTrendItem,
} from '@vben/common-ui';

export interface QuickNav extends WorkbenchQuickNavItem {
  id?: number;
}

export interface Todo extends WorkbenchTodoItem {
  id?: number;
}

export interface Trend extends WorkbenchTrendItem {
  id?: number;
}

/**
 * Định nghĩa schema cho từng bảng.
 * '++id' là primary key tự tăng.
 * Các trường sau đó là các index để tăng tốc độ truy vấn.
 */
export const baseSchema = {
  quickNavs: '++id, title',
  todos: '++id, completed',
  trends: '++id, date',
};
