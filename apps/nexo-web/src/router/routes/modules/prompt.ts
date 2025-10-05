import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/prompt-hub',
    name: 'PromptHub',
    meta: {
      icon: 'carbon:code',
      order: 0,
      title: 'Prompt Hub',
    },
    redirect: '/prompt-hub',
    children: [
      {
        path: '',
        name: 'PromptHubList',
        component: () => import('#/views/dashboard/prompt-hub/index.vue'),
        meta: {
          icon: 'carbon:data-table',
          title: 'Danh sách Prompt',
        },
      },
      {
        path: 'create',
        name: 'PromptHubCreate',
        component: () => import('#/views/dashboard/prompt-hub/create.vue'),
        meta: {
          icon: 'carbon:add-comment',
          title: 'Tạo mới Prompt',
        },
      },
      {
        path: 'edit/:id',
        name: 'PromptHubEdit',
        // TODO: Tạo component cho trang sửa, có thể tái sử dụng create-manually.vue
        component: () => import('#/views/dashboard/prompt-hub/edit.vue'),
        meta: {
          icon: 'carbon:edit',
          title: 'Chỉnh sửa Prompt',
          hideInMenu: true,
        },
      },
    ],
  },
];

export default routes;
