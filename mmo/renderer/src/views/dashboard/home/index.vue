<script lang="ts" setup>
import { Page } from '@vben/common-ui';
import { $t } from '@vben/locales';

import {
  Avatar,
  Button,
  Card,
  TypographyParagraph,
  TypographyText,
} from 'ant-design-vue';

import { features } from './data';
</script>

<template>
  <Page
    :description="$t('page.dashboard.homePageDescription')"
    :title="$t('page.dashboard.homePageTitle')"
  >
    <div class="grid gap-4 lg:grid-cols-3">
      <Card size="small" v-for="feature in features" :key="feature.key">
        <template #title>
          <div class="flex cursor-pointer items-center gap-2">
            <Avatar :src="feature.icon" alt="" />
            <TypographyText
              :ellipsis="{ tooltip: true }"
              :content="$t(`page.${feature.key}.title`)"
            />
          </div>
        </template>
        <TypographyParagraph
          :ellipsis="{ rows: 2, tooltip: true }"
          :content="$t(`page.${feature.key}.description`)"
          class="h-11"
        />
        <template #actions>
          <Button @click="feature.action()" type="primary">
            {{ $t(`page.${feature.key}.actionText`) }}
          </Button>
        </template>
      </Card>
    </div>
  </Page>
</template>

<style lang="scss" scoped></style>
