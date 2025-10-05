<script lang="ts" setup>
import type { Group } from '#/lib/db/base-schema';

import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { Card, message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { db } from '#/lib/db';

const router = useRouter();

const [CreateGroupForm] = useVbenForm({
  handleSubmit: onSubmit,
  layout: 'vertical',
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder: 'Nhập tên nhóm dự án',
      },
      fieldName: 'name',
      label: 'Tên nhóm',
      rules: 'required',
    },
    {
      component: 'ColorPicker',
      fieldName: 'color',
      label: 'Màu sắc',
    },
  ],
  wrapperClass: 'grid-cols-1',
});

async function onSubmit(values: Record<string, any>) {
  await db.groups.add(values as Group);
  message.success('Tạo nhóm dự án thành công!');
  router.push({ name: 'ProjectList' }); // Hoặc chuyển hướng đến trang quản lý nhóm
}
</script>

<template>
  <Page :title="$t('page.project.group.create')">
    <Card :title="$t('page.project.group.create')">
      <CreateGroupForm />
    </Card>
  </Page>
</template>
