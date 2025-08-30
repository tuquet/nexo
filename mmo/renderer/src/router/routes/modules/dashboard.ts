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
