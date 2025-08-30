import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:layout-dashboard',
      order: -1,
      title: $t('page.feature.title'),
    },
    name: 'Feature',
    path: '/feature',
    children: [
      {
        name: 'VideoCutter',
        path: '/video-cutter',
        component: () => import('#/views/feature/video-cutter.vue'),
        meta: {
          icon: 'carbon:workspace',
          title: $t('page.feature.video-cutter'),
          keepAlive: true,
        },
      },
      {
        name: 'YoutubeDownloader',
        path: '/youtube-downloader',
        component: () => import('#/views/feature/youtube-downloader.vue'),
        meta: {
          icon: 'ant-design:youtube-filled',
          title: $t('page.feature.youtube-downloader'),
          keepAlive: true,
        },
      },
      {
        name: 'ScriptWriter',
        path: '/script-writer',
        component: () => import('#/views/feature/script-writer.vue'),
        meta: {
          icon: 'ant-design:google-outlined',
          title: $t('page.feature.script-writer'),
          keepAlive: true,
        },
      },
    ],
  },
];

export default routes;
