<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import { AuthenticationLoginExpiredModal } from '@vben/common-ui';
import { useWatermark } from '@vben/hooks';
import { CarbonTerminal } from '@vben/icons';
import {
  BasicLayout,
  LockScreen,
  Notification,
  UserDropdown,
} from '@vben/layouts';
import { preferences } from '@vben/preferences';
import { useAccessStore, useUserStore } from '@vben/stores';

import { CloudDownloadOutlined } from '@ant-design/icons-vue';
import { FloatButton } from 'ant-design-vue';

import AppUpdater from '#/components/AppUpdater.vue'; // This component is self-contained
import LogViewer from '#/components/LogViewer.vue'; // This component is now self-contained
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

const appUpdaterRef = ref<InstanceType<typeof AppUpdater> | null>(null);

async function handleLogout() {
  await authStore.logout(false);
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
      <AppUpdater ref="appUpdaterRef" />
      <LogViewer />

      <!-- Nhóm các nút chức năng nổi -->
      <FloatButton.Group shape="square" :right="24" :bottom="100">
        <!-- Nút cập nhật, chỉ hiển thị khi có bản cập nhật -->
        <FloatButton
          v-if="
            updaterStore.updateState === 'available' ||
            updaterStore.updateState === 'downloaded'
          "
          :badge="{ dot: true }"
          :tooltip="
            updaterStore.updateState === 'available'
              ? `Cập nhật lên phiên bản ${updaterStore.updateInfo?.version}`
              : 'Cập nhật đã sẵn sàng, khởi động lại ngay!'
          "
          type="primary"
          @click="appUpdaterRef?.open()"
        >
          <template #icon><CloudDownloadOutlined /></template>
        </FloatButton>

        <!-- Nút xem Log -->
        <FloatButton
          :tooltip="loggerStore.logViewerVisible ? 'Ẩn nhật ký' : 'Xem nhật ký'"
          @click="loggerStore.toggleLogViewer()"
        >
          <template #icon>
            <CarbonTerminal v-if="loggerStore.logViewerVisible" />
            <CarbonTerminal v-else />
          </template>
        </FloatButton>
      </FloatButton.Group>
    </template>
    <template #lock-screen>
      <LockScreen :avatar @to-login="handleLogout" />
    </template>
  </BasicLayout>
</template>
