import { onMounted, reactive, readonly } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { notification } from 'ant-design-vue';

import { ipc } from '#/api/ipc';

interface BinaryStatusPayload {
  args?: Record<string, any>;
  key: string;
  percent?: number;
  status: 'complete' | 'downloading' | 'error' | 'verifying';
}

// State được định nghĩa bên ngoài để trở thành singleton,
// đảm bảo tất cả các component dùng chung một trạng thái và tiến trình tải.
const binaryManagerState = reactive({
  isReady: false,
  status: 'verifying' as BinaryStatusPayload['status'],
  message: '',
  percent: 0,
});

let isListenerSetup = false;

/**
 * Composable để quản lý các công cụ phụ thuộc (như FFmpeg).
 * Cung cấp trạng thái reactive và modal để thông báo cho người dùng về quá trình tải.
 */
export function useBinaryManager() {
  const [BinaryManagerModal, binaryManagerModalApi] = useVbenModal({
    closable: false,
    closeOnPressEscape: false,
    closeOnClickModal: false,
    footerClass: 'border-none',
    headerClass: 'border-none',
    centered: true,
  });

  function setupListeners() {
    if (isListenerSetup || !window.electron?.ipcRenderer) {
      if (!window.electron?.ipcRenderer) {
        binaryManagerState.isReady = true; // Sẵn sàng nếu không trong môi trường Electron
      }
      return;
    }

    ipc.on(
      'binary-manager:status',
      (_event: any, payload: BinaryStatusPayload) => {
        binaryManagerState.status = payload.status;
        binaryManagerState.message = $t(payload.key, payload.args || {});
        binaryManagerState.percent = payload.percent || 0;

        switch (payload.status) {
          case 'complete': {
            binaryManagerState.isReady = true;
            setTimeout(() => binaryManagerModalApi.close(), 1500);
            break;
          }
          case 'downloading':
          case 'error': {
            // Open the modal only when a download is in progress or an error occurs.
            binaryManagerState.isReady = false;
            binaryManagerModalApi.open();
            break;
          }
          case 'verifying': {
            // The check should be silent. Only update the state to disable the UI.
            binaryManagerState.isReady = false;
            break;
          }
        }
      },
    );
    isListenerSetup = true;
  }

  onMounted(setupListeners);

  async function ensureBinaries(requiredKeys: string[]) {
    if (binaryManagerState.isReady) return;
    if (!window.electron?.ipcRenderer) return;

    try {
      await ipc.invoke('binary-manager:ensure', requiredKeys);
    } catch (error) {
      console.error('Failed to invoke binary verification:', error);
      notification.error({
        message: 'Initialization Error',
        description:
          'Could not check for required tools. Please restart the application.',
      });
      binaryManagerState.status = 'error';
      binaryManagerState.message = $t('page.binaryManager.status.error');
      binaryManagerModalApi.open();
    }
  }

  return {
    binaryManagerState: readonly(binaryManagerState),
    ensureBinaries,
    BinaryManagerModal,
    binaryManagerModalApi,
  };
}
