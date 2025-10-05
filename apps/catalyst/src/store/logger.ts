import { computed, ref } from 'vue';

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
 * Hằng số chứa tất cả các cấp độ log có thể có.
 * Giúp UI và logic đồng bộ và dễ bảo trì.
 */
export const ALL_LOG_LEVELS: LogEntry['level'][] = [
  'info',
  'warn',
  'error',
  'silly',
  'verbose',
  'debug',
];

export const DEFAULT_LOG_LEVEL: LogEntry['level'][] = [
  'info',
  'warn',
  'error',
  'silly',
  'verbose',
  'debug',
];

/**
 * Store quản lý trạng thái và dữ liệu cho trình xem log (LogViewer).
 */
export const useLoggerStore = defineStore('logger', () => {
  /**
   * Trạng thái hiển thị của Log Viewer.
   */
  const logViewerVisible = ref(false);

  /**
   * Trạng thái cho biết có log mới chưa được đọc hay không.
   */
  const hasUnreadLogs = ref(false);

  /**
   * Mảng chứa tất cả các mục log.
   */
  const logs = ref<LogEntry[]>([]);

  /**
   * Mảng chứa các cấp độ log đang được chọn để hiển thị.
   * Mặc định hiển thị tất cả.
   */
  const selectedLevels = ref<LogEntry['level'][]>([...DEFAULT_LOG_LEVEL]);

  /**
   * Danh sách log đã được lọc, chỉ chứa các mục có level nằm trong `selectedLevels`.
   * Đây là một computed property, sẽ tự động cập nhật khi `logs` hoặc `selectedLevels` thay đổi.
   */
  const filteredLogs = computed(() => {
    return logs.value.filter((log) => selectedLevels.value.includes(log.level));
  });

  /**
   * Bật/tắt hoặc thiết lập trạng thái hiển thị của Log Viewer.
   * @param visible - (Tùy chọn) Trạng thái `true` để mở, `false` để đóng. Nếu bỏ qua, trạng thái sẽ được đảo ngược.
   */
  function toggleLogViewer(visible?: boolean) {
    const newVisibility =
      typeof visible === 'boolean' ? visible : !logViewerVisible.value;
    logViewerVisible.value = newVisibility;

    // Nếu mở viewer, đánh dấu là đã đọc
    if (newVisibility) {
      hasUnreadLogs.value = false;
    }
  }

  function addLog(logEntry: LogEntry) {
    logs.value.push(logEntry);
    // Khi có log mới và viewer đang đóng, đánh dấu là chưa đọc
    if (!logViewerVisible.value) {
      hasUnreadLogs.value = true;
    }
  }

  function clearLogs() {
    logs.value = [];
    hasUnreadLogs.value = false;
  }

  /**
   * Cập nhật danh sách các cấp độ log được chọn.
   * @param levels - Mảng các cấp độ log mới.
   */
  function updateSelectedLevels(levels: LogEntry['level'][]) {
    selectedLevels.value = levels;
  }

  function $reset() {
    logs.value = [];
    logViewerVisible.value = false;
    selectedLevels.value = [...ALL_LOG_LEVELS];
    hasUnreadLogs.value = false;
  }

  return {
    logViewerVisible,
    toggleLogViewer,
    logs,
    filteredLogs,
    selectedLevels,
    updateSelectedLevels,
    addLog,
    clearLogs,
    $reset,
    hasUnreadLogs,
  };
});
