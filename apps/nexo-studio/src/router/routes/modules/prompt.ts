import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/prompt-video-maker',
    name: 'PromptVideoMaker',
    component: () => import('#/views/dashboard/prompt-video-maker/index.vue'),
    meta: {
      title: 'Prompt Video Maker',
    },
  },
];

export default routes;
