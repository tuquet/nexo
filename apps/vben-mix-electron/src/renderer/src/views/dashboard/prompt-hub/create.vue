<script setup lang="ts">
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Col, Row, Typography } from 'ant-design-vue';

import CreateManually from './create-manually.vue';

// Ref để lưu trữ prompt được tạo ra để hiển thị ở cột xem trước
const previewPrompt = ref('');
</script>

<template>
  <Page title="Tạo mới Prompt" content-full-height>
    <Row :gutter="16" class="h-full">
      <!-- Cột trái: Form tạo prompt -->
      <Col :span="12">
        <CreateManually
          @update:prompt-preview="(value) => (previewPrompt = value)"
        />
      </Col>
      <!-- Cột phải: Xem trước prompt -->
      <Col :span="12">
        <Card title="Prompt Hoàn Chỉnh (Xem trước)" class="h-full">
          <Typography.Paragraph
            copyable
            style="min-height: 200px; white-space: pre-wrap"
          >
            {{ previewPrompt || 'Nội dung prompt sẽ được hiển thị ở đây...' }}
          </Typography.Paragraph>
        </Card>
      </Col>
    </Row>
  </Page>
</template>
