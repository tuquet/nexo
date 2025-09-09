import { ref } from 'vue';

import { defineStore } from 'pinia';

export interface LogEntry {
  date: Date;
  level: 'debug' | 'error' | 'info' | 'silly' | 'verbose' | 'warn';
  message: string;
}

export const useUiStore = defineStore('ui', () => {
  /**
   * Trạng thái hiển thị của Log Viewer.
   */
  const logViewerVisible = ref(false);
  const logs = ref<LogEntry[]>([]);

  /**
   * Bật/tắt hoặc thiết lập trạng thái hiển thị của Log Viewer.
   */
  function toggleLogViewer(visible?: boolean) {
    logViewerVisible.value =
      typeof visible === 'boolean' ? visible : !logViewerVisible.value;
  }

  /**
   * Thêm một mục log mới vào store.
   * @param logEntry - Đối tượng log cần thêm.
   */
  function addLog(logEntry: LogEntry) {
    logs.value.push(logEntry);
  }

  /**
   * Xóa tất cả các log khỏi store.
   */
  function clearLogs() {
    logs.value = [];
  }

  return { logViewerVisible, toggleLogViewer, logs, addLog, clearLogs };
});
