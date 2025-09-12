<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { AuthenticationLoginExpiredModal } from '@vben/common-ui';
import { useWatermark } from '@vben/hooks';
import { CarbonCicsProgram, CarbonDownload, CircleHelp } from '@vben/icons';
import {
  BasicLayout,
  LockScreen,
  Notification,
  UserDropdown,
} from '@vben/layouts';
import { $t } from '@vben/locales';
import {
  clearPreferencesCache,
  preferences,
  resetPreferences,
} from '@vben/preferences';
import { useAccessStore, useUserStore } from '@vben/stores';
import { openWindow } from '@vben/utils';

import { useMagicKeys, whenever } from '@vueuse/core';
import { Badge, Button, Popconfirm, Tooltip } from 'ant-design-vue';

import AppUpdater from '#/components/AppUpdater.vue';
import LogViewer from '#/components/LogViewer.vue';
import {
  useAuthStore,
  useLoggerStore,
  useNotificationStore,
  useUpdaterStore,
} from '#/store';
import LoginForm from '#/views/_core/authentication/login.vue';

const userStore = useUserStore();
const authStore = useAuthStore();
const accessStore = useAccessStore();
const notificationStore = useNotificationStore();
const updaterStore = useUpdaterStore();
const loggerStore = useLoggerStore();
const { destroyWatermark, updateWatermark } = useWatermark();
const route = useRoute();
const isDev = import.meta.env.DEV;

const popconfirmVisible = ref(false);

const menus = computed(() => [
  {
    handler: () => {
      openWindow('https://www.facebook.com/profile.php?id=61580420255865', {
        target: '_blank',
      });
    },
    icon: CircleHelp,
    text: $t('ui.widgets.qa'),
  },
  {
    divider: true,
  },
]);

const avatar = computed(() => {
  return userStore.userInfo?.avatar ?? preferences.app.defaultAvatar;
});

async function handleLogout() {
  await authStore.logout(false);
  await resetPreferences();
  await clearPreferencesCache();
}

function handleViewAllNotifications() {
  // This can be extended to navigate to a dedicated notifications page
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

watch(
  () => updaterStore.updateState,
  (newState) => {
    if (newState === 'available') {
      popconfirmVisible.value = true;
    }
  },
);

// --- Phím tắt toàn cục cho Log Viewer ---
// Đặt ở đây để đảm bảo nó được đăng ký một lần và luôn hoạt động
const keys = useMagicKeys();
// Theo cài đặt trong preferences/blocks/shortcut-keys/global.vue, phím tắt là Alt+V
const toggleLoggerShortcut = keys['alt+v'];

whenever(toggleLoggerShortcut!, () => {
  loggerStore.toggleLogViewer();
});
</script>

<template>
  <BasicLayout @clear-preferences-and-logout="handleLogout">
    <template #header-right-51-updater>
      <Popconfirm
        v-if="
          updaterStore.updateState === 'available' ||
          updaterStore.updateState === 'downloaded' ||
          updaterStore.updateState === 'downloading'
        "
        v-model:open="popconfirmVisible"
        cancel-text="Để sau"
        ok-text="Xem ngay"
        placement="bottomRight"
        :trigger="updaterStore.updateState === 'downloading' ? [] : 'hover'"
        @confirm="updaterStore.toggleUpdaterViewer(true)"
      >
        <template #title>
          <template v-if="updaterStore.updateState === 'available'">
            <p class="font-semibold">Đã có phiên bản mới!</p>
            <p>
              Cập nhật lên phiên bản
              <strong>{{ updaterStore.updateInfo?.version }}</strong>
              để trải nghiệm.
            </p>
          </template>
          <template v-if="updaterStore.updateState === 'downloaded'">
            <p class="font-semibold">Cập nhật đã sẵn sàng!</p>
            <p>Khởi động lại ứng dụng để hoàn tất.</p>
          </template>
        </template>
        <Badge dot :offset="[-5, 5]">
          <Button
            shape="circle"
            type="text"
            @click="updaterStore.toggleUpdaterViewer(true)"
          >
            <template #icon>
              <CarbonDownload class="text-foreground text-[18px]" />
            </template>
          </Button>
        </Badge>
      </Popconfirm>
    </template>
    <template #header-right-52-terminal>
      <Tooltip :title="`${$t('page.logViewer.cardTitle')} (Alt+V)`">
        <Badge dot :offset="[-5, 5]">
          <Button
            type="text"
            shape="circle"
            @click="loggerStore.toggleLogViewer()"
          >
            <template #icon>
              <CarbonCicsProgram class="text-foreground text-[18px]" />
            </template>
          </Button>
        </Badge>
      </Tooltip>
    </template>
    <template #user-dropdown>
      <UserDropdown
        :avatar
        :menus
        text="Mèo Nhỏ"
        description="Bắt đầu khám phá!"
        tag-text="Xinh đẹp"
        @logout="handleLogout"
      />
    </template>
    <template #notification>
      <Notification
        :dot="notificationStore.getUnreadCount > 0"
        :notifications="notificationStore.getNotifications"
        @clear="notificationStore.clearAll"
        @make-all="notificationStore.markAllAsRead"
        @view-all="handleViewAllNotifications"
      />
    </template>
    <template #extra>
      <AuthenticationLoginExpiredModal
        v-model:open="accessStore.loginExpired"
        :avatar
      >
        <LoginForm />
      </AuthenticationLoginExpiredModal>
      <div
        v-if="isDev"
        class="fixed bottom-2 left-2 z-[1000] rounded-md bg-black/60 px-3 py-1 text-xs font-semibold text-white shadow-lg"
      >
        Current Route: {{ route.fullPath }}
      </div>
      <AppUpdater />
      <LogViewer />
    </template>
    <template #lock-screen>
      <LockScreen :avatar @to-login="handleLogout" />
    </template>
  </BasicLayout>
</template>
