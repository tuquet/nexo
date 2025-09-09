import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:layout-dashboard',
      order: -1,
      title: $t('page.dashboard.title'),
    },
    name: 'Dashboard',
    path: '/dashboard',
    children: [
      {
        name: 'Analytics',
        path: '/analytics',
        component: () => import('#/views/dashboard/analytics/index.vue'),
        meta: {
          affixTab: false,
          icon: 'lucide:area-chart',
          title: $t('page.dashboard.analytics'),
          hideInMenu: true,
          hideInBreadcrumb: true,
          hideInTab: true,
        },
      },
      {
        name: 'Workspace',
        path: '/workspace',
        // component: () => import('#/views/dashboard/workspace/index.vue'),
        component: () => import('#/views/dashboard/home/index.vue'),
        meta: {
          affixTab: false,
          icon: 'carbon:workspace',
          title: $t('page.dashboard.workspace'),
          hideInMenu: true,
          hideInMenuTab: true,
          hideInTab: true,
        },
      },
      {
        name: 'Home',
        path: '/home',
        component: () => import('#/views/dashboard/home/index.vue'),
        meta: {
          affixTab: true,
          icon: 'carbon:workspace',
          title: $t('page.dashboard.home'),
        },
      },
    ],
  },
];

export default routes;
