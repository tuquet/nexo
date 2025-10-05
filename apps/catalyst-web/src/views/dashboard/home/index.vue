<script lang="ts" setup>
import { Page } from '@vben/common-ui';
import { $t } from '@vben/locales';

import {
  Avatar,
  Button,
  Card,
  TypographyParagraph,
  TypographyTitle,
} from 'ant-design-vue';

import { features } from './data';
</script>

<template>
  <Page
    :description="$t('page.dashboard.homePageDescription')"
    :title="$t('page.dashboard.homePageTitle')"
  >
    <div class="grid gap-4 lg:grid-cols-3">
      <Card v-for="feature in features" :key="feature.key">
        <div>
          <div class="mb-2">
            <Avatar
              :src="feature.icon"
              shape="square"
              :alt="feature.key"
              :size="48"
            />
          </div>

          <TypographyTitle
            :ellipsis="{ tooltip: true }"
            :content="$t(`page.${feature.key}.title`)"
            :level="3"
          />
          <TypographyParagraph
            :ellipsis="{ rows: 3, tooltip: true }"
            :content="$t(`page.${feature.key}.description`)"
            class="h-20"
          />
          <div>
            <Button @click="feature.action()" type="primary">
              {{ $t(`page.${feature.key}.actionText`) }}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  </Page>
</template>

<style lang="scss" scoped></style>
