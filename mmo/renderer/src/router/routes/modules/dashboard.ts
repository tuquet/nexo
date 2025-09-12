import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:layout-dashboard',
      order: -1,
      title: $t('page.dashboard.home'),
    },
    name: 'Dashboard',
    path: '/dashboard',
    redirect: '/home',
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
          hideInMenu: true,
          hideInMenuTab: true,
          hideInTab: true,
        },
      },
    ],
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('#/views/dashboard/settings/index.vue'),
    meta: {
      // Sử dụng icon từ thư viện icon của bạn, ví dụ: Ant Design Icons
      icon: 'carbon:ibm-cloud-sysdig-secure',
      title: $t('page.settings.title'),
    },
  },
];

export default routes;
