import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/prompt-hub',
    name: 'PromptHub',
    meta: {
      icon: 'carbon:pen',
      order: 3,
      title: 'Prompt Hub',
    },
    redirect: '/prompt-hub',
    children: [
      {
        path: '',
        name: 'PromptHubList',
        component: () => import('#/views/dashboard/prompt-hub/index.vue'),
        meta: {
          title: 'Danh sách Prompt',
        },
      },
      {
        path: 'create',
        name: 'PromptHubCreate',
        component: () => import('#/views/dashboard/prompt-hub/create.vue'),
        meta: {
          title: 'Tạo mới Prompt',
        },
      },
      {
        path: 'edit/:id',
        name: 'PromptHubEdit',
        // TODO: Tạo component cho trang sửa, có thể tái sử dụng create-manually.vue
        component: () => import('#/views/dashboard/prompt-hub/edit.vue'),
        meta: {
          title: 'Chỉnh sửa Prompt',
        },
      },
    ],
  },
];

export default routes;
