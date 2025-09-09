import { ref } from 'vue';

import { defineStore } from 'pinia';

/**
 * Định nghĩa cấu trúc của một mục log.
 */
export interface LogEntry {
  date: Date;
  level: 'debug' | 'error' | 'info' | 'silly' | 'verbose' | 'warn';
  message: string;
}

/**
 * Store quản lý trạng thái và dữ liệu cho trình xem log (LogViewer).
 */
export const useLoggerStore = defineStore('logger', () => {
  /**
   * Trạng thái hiển thị của Log Viewer.
   */
  const logViewerVisible = ref(false);

  /**
   * Mảng chứa tất cả các mục log.
   */
  const logs = ref<LogEntry[]>([]);

  /**
   * Bật/tắt hoặc thiết lập trạng thái hiển thị của Log Viewer.
   * @param visible - (Tùy chọn) Trạng thái `true` để mở, `false` để đóng. Nếu bỏ qua, trạng thái sẽ được đảo ngược.
   */
  function toggleLogViewer(visible?: boolean) {
    logViewerVisible.value =
      typeof visible === 'boolean' ? visible : !logViewerVisible.value;
  }

  function addLog(logEntry: LogEntry) {
    logs.value.push(logEntry);
  }

  function clearLogs() {
    logs.value = [];
  }

  function $reset() {
    logs.value = [];
    logViewerVisible.value = false;
  }

  return { logViewerVisible, toggleLogViewer, logs, addLog, clearLogs, $reset };
});
