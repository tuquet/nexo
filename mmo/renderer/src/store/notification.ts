import type { NotificationItem } from '@vben/layouts';

import { computed, ref } from 'vue';

import { defineStore } from 'pinia';

export const useNotificationStore = defineStore('app-notification', () => {
  const notifications = ref<NotificationItem[]>([]);

  const getNotifications = computed(() => notifications.value);
  const getUnreadCount = computed(
    () => notifications.value.filter((item) => !item.isRead).length,
  );

  function addNotification(
    notification: Omit<NotificationItem, 'date' | 'id' | 'isRead'>,
  ) {
    const newNotification: NotificationItem = {
      ...notification,
      isRead: false,
      date: new Date().toLocaleString(),
    };
    notifications.value.unshift(newNotification);
  }

  function markAllAsRead() {
    notifications.value.forEach((item) => (item.isRead = true));
  }

  function clearAll() {
    notifications.value = [];
  }

  function $reset() {
    notifications.value = [];
  }

  return {
    notifications,
    getNotifications,
    getUnreadCount,
    addNotification,
    markAllAsRead,
    clearAll,
    $reset,
  };
});
