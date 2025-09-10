<script lang="ts" setup>
import { Page } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { Card, message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';

const [Form] = useVbenForm({
  handleSubmit,
  layout: 'vertical',
  // Bố cục 2 cột trên màn hình vừa và lớn
  wrapperClass: 'grid-cols-1 md:grid-cols-3 gap-x-5',
  schema: [
    {
      component: 'Select',
      fieldName: 'apiProvider',
      label: $t('page.aiScriptWriter.apiProvider.label'),
      componentProps: {
        class: 'w-full',
        options: [
          {
            label: $t('page.aiScriptWriter.apiProvider.options.gemini'),
            value: 'gemini',
          },
          {
            label: $t('page.aiScriptWriter.apiProvider.options.chatGPT'),
            value: 'chatGPT',
          },
        ],
      },
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'topic',
      label: $t('page.aiScriptWriter.topic.label'),
      componentProps: {
        placeholder: $t('page.aiScriptWriter.topic.placeholder'),
        rows: 4,
      },
      rules: 'required',
    },
    {
      component: 'Select',
      fieldName: 'scriptType',
      label: $t('page.aiScriptWriter.scriptType.label'),
      componentProps: {
        class: 'w-full',
        options: [
          {
            label: $t('page.aiScriptWriter.scriptType.options.shortFilm'),
            value: 'shortFilm',
          },
          {
            label: $t('page.aiScriptWriter.scriptType.options.vlogOutline'),
            value: 'vlogOutline',
          },
          {
            label: $t('page.aiScriptWriter.scriptType.options.podcastScript'),
            value: 'podcastScript',
          },
          {
            label: $t('page.aiScriptWriter.scriptType.options.status'),
            value: 'status',
          },
        ],
      },
      rules: 'required',
    },
    {
      component: 'Select',
      fieldName: 'language',
      label: $t('page.aiScriptWriter.language.label'),
      componentProps: {
        class: 'w-full',
        options: [
          {
            label: $t('page.aiScriptWriter.language.options.vietnamese'),
            value: 'vietnamese',
          },
          {
            label: $t('page.aiScriptWriter.language.options.english'),
            value: 'english',
          },
        ],
      },
      rules: 'required',
    },
    {
      component: 'Select',
      fieldName: 'genres',
      label: $t('page.aiScriptWriter.genres.label'),
      componentProps: {
        class: 'w-full',
        mode: 'tags',
        placeholder: $t('page.aiScriptWriter.genres.placeholder'),
      },
    },
    {
      component: 'InputNumber',
      fieldName: 'characterCount',
      label: $t('page.aiScriptWriter.characterCount.label'),
      componentProps: {
        class: 'w-full',
        min: 10,
        max: 5000,
      },
    },
    {
      component: 'Input',
      fieldName: 'mainCharacter',
      label: $t('page.aiScriptWriter.mainCharacter.label'),
      componentProps: {
        placeholder: $t('page.aiScriptWriter.mainCharacter.placeholder'),
      },
    },
    {
      component: 'Input',
      fieldName: 'setting',
      label: $t('page.aiScriptWriter.setting.label'),
      componentProps: {
        placeholder: $t('page.aiScriptWriter.setting.placeholder'),
      },
    },
    {
      component: 'Input',
      fieldName: 'targetAudience',
      label: $t('page.aiScriptWriter.targetAudience.label'),
      componentProps: {
        placeholder: $t('page.aiScriptWriter.targetAudience.placeholder'),
      },
    },
    {
      component: 'Input',
      fieldName: 'callToAction',
      label: $t('page.aiScriptWriter.callToAction.label'),
      componentProps: {
        placeholder: $t('page.aiScriptWriter.callToAction.placeholder'),
      },
    },
    {
      component: 'Switch',
      fieldName: 'advancedSwitch',
      label: $t('page.aiScriptWriter.advancedSwitch.label'),
    },
    {
      component: 'InputNumber',
      fieldName: 'temperature',
      label: $t('page.aiScriptWriter.temperature.label'),
      componentProps: {
        min: 0,
        max: 1,
        step: 0.1,
      },
      dependencies: {
        if: (values) => values.advancedSwitch,
        triggerFields: ['advancedSwitch'],
      },
      help: $t('page.aiScriptWriter.temperature.help'),
    },
  ],
});

function handleSubmit(values: Record<string, any>) {
  message.loading({
    content: $t('page.aiScriptWriter.generatingTip'),
    duration: 0, // indefinite
  });

  // Mô phỏng việc gọi API đến AI
  setTimeout(() => {
    message.destroy(); // Đóng thông báo loading
    message.success({
      content: $t('page.aiScriptWriter.generatedScript.submitted', {
        topic: values.topic,
      }),
    });
    // Tại đây, bạn sẽ xử lý và hiển thị kết quả trả về từ AI.
  }, 2000);
}
</script>

<template>
  <Page
    :description="$t('page.aiScriptWriter.description')"
    :title="$t('page.aiScriptWriter.title')"
  >
    <Card :title="$t('page.aiScriptWriter.cardTitle')">
      <Form />
    </Card>
  </Page>
</template>
