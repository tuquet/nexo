<script lang="ts" setup>
import type { NotificationItem } from '@vben/layouts';

import type { LogEntry } from '#/store/ui';

import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { AuthenticationLoginExpiredModal } from '@vben/common-ui';
import { useWatermark } from '@vben/hooks';
import {
  BasicLayout,
  LockScreen,
  Notification,
  UserDropdown,
} from '@vben/layouts';
import { preferences } from '@vben/preferences';
import { useAccessStore, useUserStore } from '@vben/stores';

import { DownOutlined, UpOutlined } from '@ant-design/icons-vue';
import { Drawer, FloatButton } from 'ant-design-vue';

import LogViewer from '#/components/LogViewer.vue';
import { useAuthStore } from '#/store';
import { useUiStore } from '#/store/ui';
import LoginForm from '#/views/_core/authentication/login.vue';

const notifications = ref<NotificationItem[]>([]);
const logViewerHeight = 300;

const uiStore = useUiStore();
const userStore = useUserStore();
const authStore = useAuthStore();
const accessStore = useAccessStore();
const route = useRoute();
const { destroyWatermark, updateWatermark } = useWatermark();
const showDot = computed(() =>
  notifications.value.some((item) => !item.isRead),
);

const menus = computed(() => [
  // {
  //   handler: () => {
  //     openWindow(VBEN_DOC_URL, {
  //       target: '_blank',
  //     });
  //   },
  //   icon: BookOpenText,
  //   text: $t('ui.widgets.document'),
  // },
  // {
  //   handler: () => {
  //     openWindow(VBEN_GITHUB_URL, {
  //       target: '_blank',
  //     });
  //   },
  //   icon: MdiGithub,
  //   text: 'GitHub',
  // },
  // {
  //   handler: () => {
  //     openWindow(`${VBEN_GITHUB_URL}/issues`, {
  //       target: '_blank',
  //     });
  //   },
  //   icon: CircleHelp,
  //   text: $t('ui.widgets.qa'),
  // },
]);

const avatar = computed(() => {
  return userStore.userInfo?.avatar ?? preferences.app.defaultAvatar;
});

async function handleLogout() {
  await authStore.logout(false);
}

function handleNoticeClear() {
  notifications.value = [];
}

function handleMakeAll() {
  notifications.value.forEach((item) => (item.isRead = true));
}

watch(
  () => preferences.app.watermark,
  async (enable) => {
    if (enable) {
      await updateWatermark({
        content: `${userStore.userInfo?.username} - ${userStore.userInfo?.realName}`,
      });
    } else {
      destroyWatermark();
    }
  },
  {
    immediate: true,
  },
);

let removeLogListener: (() => void) | undefined;

onMounted(() => {
  // Thiết lập listener cho log ở cấp layout để đảm bảo log được thu thập
  // ngay cả khi LogViewer không hiển thị. Log sẽ được lưu trong store.
  if (window.electron?.ipcRenderer) {
    removeLogListener = window.electron.ipcRenderer.on(
      'app-log',
      (_event: any, logEntry: LogEntry) => {
        uiStore.addLog(logEntry);
      },
    );
  } else {
    // Fallback cho môi trường không phải Electron hoặc khi preload thất bại
    console.warn(
      'window.electron.ipcRenderer is not available. Cannot receive logs from main process.',
    );
    uiStore.addLog({
      level: 'warn',
      message:
        'window.electron.ipcRenderer is not available. Cannot receive logs from main process.',
      date: new Date(),
    });
  }
});

onUnmounted(() => {
  removeLogListener?.();
});
</script>

<template>
  <BasicLayout @clear-preferences-and-logout="handleLogout">
    <template #user-dropdown>
      <UserDropdown
        :avatar
        :menus
        :text="userStore.userInfo?.realName"
        description="Free"
        tag-text="Pro"
        @logout="handleLogout"
      />
    </template>
    <template #notification>
      <Notification
        :dot="showDot"
        :notifications="notifications"
        @clear="handleNoticeClear"
        @make-all="handleMakeAll"
      />
    </template>
    <template #extra>
      <AuthenticationLoginExpiredModal
        v-model:open="accessStore.loginExpired"
        :avatar
      >
        <LoginForm />
      </AuthenticationLoginExpiredModal>

      <!-- Drawer để hiển thị LogViewer, có thể thò ra thụt vào -->
      <Drawer
        v-model:open="uiStore.logViewerVisible"
        placement="bottom"
        :height="logViewerHeight"
        :body-style="{ padding: 0 }"
        :mask="false"
        :destroy-on-close="true"
        :header-style="{ display: 'none' }"
      >
        <!-- Không cần lắng nghe sự kiện 'close' nữa vì component con sẽ tự xử lý -->
        <LogViewer class="h-full" />
      </Drawer>

      <!-- Nút nổi để bật/tắt LogViewer -->
      <FloatButton
        v-if="!uiStore.logViewerVisible"
        :tooltip="
          uiStore.logViewerVisible ? 'Hide Logs' : 'View Application Logs'
        "
        :style="{
          bottom: uiStore.logViewerVisible ? `${logViewerHeight}px` : '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          transition: 'bottom 0.3s ease-in-out',
        }"
        @click="uiStore.toggleLogViewer()"
      >
        <template #icon>
          <DownOutlined v-if="uiStore.logViewerVisible" />
          <UpOutlined v-else />
        </template>
      </FloatButton>

      <!-- Một helper nhỏ để hiển thị route hiện tại trên màn hình khi đang development -->
      <div
        class="fixed bottom-2 left-2 z-[1000] rounded-md bg-black/60 px-3 py-1 text-xs font-semibold text-white shadow-lg"
      >
        Current Route: {{ route.fullPath }}
      </div>
    </template>
    <template #lock-screen>
      <LockScreen :avatar @to-login="handleLogout" />
    </template>
  </BasicLayout>
</template>
