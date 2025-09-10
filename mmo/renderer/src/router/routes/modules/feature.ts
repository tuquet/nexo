import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:layout-dashboard',
      order: -1,
      title: $t('page.features.title'),
    },
    name: 'Feature',
    path: '/features',
    children: [
      {
        name: 'VideoCutter',
        path: '/video-cutter',
        component: () => import('#/views/features/video-cutter.vue'),
        meta: {
          icon: 'carbon:workspace',
          title: $t('page.videoCutter.title'),
          keepAlive: true,
        },
      },
      {
        name: 'YoutubeDownloader',
        path: '/video-downloader',
        component: () => import('#/views/features/video-downloader.vue'),
        meta: {
          icon: 'ant-design:videoilled',
          title: $t('page.videoDownloader.title'),
          keepAlive: true,
        },
      },
      {
        name: 'ScriptWriter',
        path: '/ai-script-writer',
        component: () => import('#/views/features/ai-script-writer.vue'),
        meta: {
          icon: 'ant-design:google-outlined',
          title: $t('page.aiScriptWriter.title'),
          keepAlive: true,
        },
      },
    ],
  },
];

export default routes;
