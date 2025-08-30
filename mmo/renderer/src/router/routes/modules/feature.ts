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
        },
      },
      {
        name: 'YoutubeDownloader',
        path: '/youtube-downloader',
        component: () => import('#/views/feature/youtube-downloader.vue'),
        meta: {
          icon: 'ant-design:youtube-filled',
          title: $t('page.feature.youtube-downloader'),
        },
      },
    ],
  },
];

export default routes;
