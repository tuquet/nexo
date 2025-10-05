<script lang="ts" setup>
import type { Project } from '#/lib/db/project-schema';

import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Card, message } from 'ant-design-vue';

import { useVbenForm, z } from '#/adapter/form';
import { db } from '#/lib/db';
import { $t } from '#/locales';

const router = useRouter();

const [CreateForm] = useVbenForm({
  handleSubmit: onSubmit,
  layout: 'vertical',
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder: 'Nhập tiêu đề dự án',
      },
      fieldName: 'title',
      label: 'Tiêu đề',
      rules: 'required',
    },
    {
      component: 'ApiSelect',
      componentProps: {
        api: async () => db.groups.toArray(),
        labelField: 'name',
        valueField: 'id',
        placeholder: 'Chọn nhóm cho dự án',
      },
      fieldName: 'groupId',
      label: 'Nhóm',
    },
    {
      component: 'Textarea',
      componentProps: {
        placeholder: 'Nhập mô tả chi tiết cho dự án',
        rows: 4,
      },
      fieldName: 'content',
      label: 'Nội dung',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: 'https://youtube.com/your-video',
      },
      fieldName: 'url',
      label: 'Đường dẫn (URL)',
      rules: z.string().url({ message: 'Vui lòng nhập URL hợp lệ' }).optional(),
    },
    {
      component: 'IconPicker',
      fieldName: 'icon',
      label: 'Biểu tượng',
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
  const projectData = {
    ...values,
    date: new Date().toISOString(),
    group: '', // Sẽ được điền tự động khi load
  } as Omit<Project, 'id'>;
  await db.projects.add(projectData as Project);
  message.success('Tạo dự án thành công!');
  router.push({ name: 'ProjectList' });
}
</script>

<template>
  <Page :title="$t('page.project.create')">
    <Card :title="$t('page.project.create')">
      <CreateForm />
    </Card>
  </Page>
</template>
