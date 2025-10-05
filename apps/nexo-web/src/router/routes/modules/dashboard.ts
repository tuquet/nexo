import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'carbon:dashboard',
      order: -1,
      title: $t('page.dashboard.title'),
      hideInMenu: true,
    },
    name: 'Dashboard',
    path: '/dashboard',
    children: [
      {
        name: 'Workspace',
        path: '/workspace',
        component: () => import('#/views/dashboard/workspace/index.vue'),
        meta: {
          affixTab: true,
          icon: 'carbon:workspace',
          title: $t('page.dashboard.workspace.title'),
          hideInMenu: true,
        },
      },
      // {
      //   name: 'Analytics',
      //   path: '/analytics',
      //   component: () => import('#/views/dashboard/analytics/index.vue'),
      //   meta: {
      //     icon: 'carbon:analytics',
      //     title: $t('page.dashboard.analytics'),
      //   },
      // },
    ],
  },
];

export default routes;
