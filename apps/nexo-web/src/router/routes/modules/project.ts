import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'carbon:folder-open',
      order: 1,
      title: $t('page.project.title'),
    },
    name: 'Project',
    path: '/project',
    children: [
      {
        name: 'ProjectList',
        path: '',
        component: () => import('#/views/dashboard/project/index.vue'),
        meta: {
          icon: 'carbon:list-boxes',
          title: $t('page.project.list'),
          hideInMenu: true,
        },
      },
      {
        name: 'ProjectView',
        path: ':id/view',
        component: () => import('#/views/dashboard/project/view.vue'),
        meta: {
          icon: 'carbon:view-filled',
          title: $t('page.project.view'),
          hideInMenu: true,
        },
        props: true,
      },
      {
        name: 'ProjectCreate',
        path: 'create',
        component: () => import('#/views/dashboard/project/create.vue'),
        meta: {
          icon: 'carbon:add-filled',
          title: $t('page.project.create'),
          hideInMenu: true,
        },
      },
    ],
  },
  {
    name: 'ProjectGroup',
    path: '/project-group',
    meta: {
      icon: 'carbon:folder-details',
      order: 2,
      title: $t('page.project.group.title'),
    },
    children: [
      {
        name: 'ProjectGroupList',
        path: '',
        component: () => import('#/views/dashboard/project-group/index.vue'),
        meta: {
          icon: 'carbon:list-checked',
          title: $t('page.project.group.list'),
          hideInMenu: true,
        },
      },
      {
        name: 'ProjectGroupView',
        path: ':id/view',
        component: () => import('#/views/dashboard/project-group/view.vue'),
        meta: {
          icon: 'carbon:group-objects',
          title: $t('page.project.group.view'),
          hideInMenu: true,
        },
      },
      {
        name: 'ProjectGroupCreate',
        path: 'group/create',
        component: () => import('#/views/dashboard/project-group/create.vue'),
        meta: {
          icon: 'carbon:new-tab',
          title: $t('page.project.group.create'),
          hideInMenu: true,
        },
      },
    ],
  },
];

export default routes;
