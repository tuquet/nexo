<script setup>
import { Avatar, Button, Card, TypographyParagraph } from 'ant-design-vue';

import { router } from '#/router';

const features = [
  {
    title: 'Video Cutter: Quickly Cut & Split Videos',
    description:
      'Turn long videos into meaningful short clips. Cut and share your favorite video segments in just a few seconds.',
    icon: 'https://cdn-icons-png.flaticon.com/128/10728/10728392.png',
    cover:
      'https://images.unsplash.com/photo-1574717519105-620355a34723?q=80&w=800&h=450&auto=format&fit=crop',
    actionText: 'Explore',
    action: () => {
      router.push('/video-cutter');
    },
  },
  {
    title: 'YouTube Downloader: Download Videos from YouTube',
    description:
      'Paste a YouTube video link and easily download it to your computer in high quality.',
    icon: 'https://cdn-icons-png.flaticon.com/128/1384/1384060.png',
    cover:
      'https://images.unsplash.com/photo-1611162617213-6d22e5257410?q=80&w=800&h=450&auto=format&fit=crop',
    actionText: 'Explore',
    action: () => {
      router.push('/youtube-downloader');
    },
  },
];
</script>

<template>
  <div class="p-5">
    <div class="grid grid-cols-3 gap-6">
      <Card v-for="feature in features" :key="feature.title">
        <template #title>
          <div class="flex cursor-pointer items-center gap-2">
            <Avatar :src="feature.icon" alt="" />
            <div>{{ feature.title }}</div>
          </div>
        </template>
        <TypographyParagraph :ellipsis="2" :content="feature.description" />
        <template #actions>
          <Button @click="feature.action()" type="primary">
            {{ feature.actionText }}
          </Button>
        </template>
      </Card>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
