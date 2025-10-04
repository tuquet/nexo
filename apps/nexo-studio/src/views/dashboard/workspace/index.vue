<script lang="ts" setup>
import type {
  WorkbenchProjectItem,
  WorkbenchQuickNavItem,
  WorkbenchTodoItem,
  WorkbenchTrendItem,
} from '@vben/common-ui';

import type { Project } from '#/lib/db/base-schema';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  AnalysisChartCard,
  WorkbenchHeader,
  WorkbenchProject,
  WorkbenchQuickNav,
  WorkbenchTodo,
  WorkbenchTrends,
} from '@vben/common-ui';
import { $t } from '@vben/locales';
import { preferences } from '@vben/preferences';
import { useUserStore } from '@vben/stores';

import { message } from 'ant-design-vue';

import { db } from '#/lib/db';

import AnalyticsVisitsSource from '../analytics/analytics-visits-source.vue';

const userStore = useUserStore();

const projectItems = ref<WorkbenchProjectItem[]>([]);
const quickNavItems = ref<WorkbenchQuickNavItem[]>([]);
const todoItems = ref<WorkbenchTodoItem[]>([]);
const trendItems = ref<WorkbenchTrendItem[]>([]);

onMounted(async () => {
  // Cập nhật state của component
  const [projectsFromDb, groupsFromDb, quickNavs, todos, trends] =
    await Promise.all([
      db.projects.toArray(),
      db.groups.toArray(),
      db.quickNavs.toArray(),
      db.todos.toArray(),
      db.trends.toArray(),
    ]);

  // Tạo một map để tra cứu group nhanh hơn, tránh lặp O(n^2)
  const groupMap = new Map(groupsFromDb.map((g) => [g.id, g.name]));

  // "Join" dữ liệu: Ánh xạ projects từ DB sang dạng mà component UI cần
  // Thêm thuộc tính `group` (tên nhóm) vào mỗi project
  projectItems.value = projectsFromDb.map((p) => ({
    ...p,
    // Lấy tên group từ map, nếu không tìm thấy thì trả về chuỗi rỗng
    group: p.groupId ? groupMap.get(p.groupId) || '' : '',
  }));
  quickNavItems.value = quickNavs;
  todoItems.value = todos;
  trendItems.value = trends;
});

const router = useRouter();

// 这是一个示例方法，实际项目中需要根据实际情况进行调整
// This is a sample method, adjust according to the actual project requirements
function navTo(nav: Project) {
  if (nav.groupId) {
    router
      .push({ name: 'ProjectView', params: { id: nav.groupId! } })
      .catch((error) => {
        console.error('Navigation failed:', error);
      });
  } else {
    message.error('Navigation failed:');
  }
}
</script>

<template>
  <div class="p-5">
    <WorkbenchHeader
      :avatar="userStore.userInfo?.avatar || preferences.app.defaultAvatar"
    >
      <template #title>
        {{
          $t('page.dashboard.workspace.header.greeting', {
            name: userStore.userInfo?.realName,
          })
        }}
      </template>
      <template #description>
        {{ $t('page.dashboard.workspace.header.weather') }}
      </template>
    </WorkbenchHeader>

    <div class="mt-5 flex flex-col lg:flex-row">
      <div class="mr-4 w-full lg:w-3/5">
        <WorkbenchProject
          :items="projectItems"
          :title="$t('page.project.title')"
          @click="navTo"
        />
        <WorkbenchTrends
          :items="trendItems"
          class="mt-5"
          :title="$t('page.dashboard.workspace.trends')"
        />
      </div>
      <div class="w-full lg:w-2/5">
        <WorkbenchQuickNav
          :items="quickNavItems"
          class="mt-5 lg:mt-0"
          :title="$t('page.dashboard.workspace.quickNav')"
          @click="navTo"
        />
        <WorkbenchTodo
          :items="todoItems"
          class="mt-5"
          :title="$t('page.dashboard.workspace.todo')"
        />
        <AnalysisChartCard
          class="mt-5"
          :title="$t('page.dashboard.workspace.visitsSource')"
        >
          <AnalyticsVisitsSource />
        </AnalysisChartCard>
      </div>
    </div>
  </div>
</template>
