<script lang="ts" setup>
import { h, onMounted, ref } from 'vue';

import { Page, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { BulbOutlined } from '@ant-design/icons-vue';
import { useStorage } from '@vueuse/core';
import { Button, Card, message } from 'ant-design-vue';
import { storeToRefs } from 'pinia';

import { useVbenForm } from '#/adapter/form';
import { useCustomSelectOptions } from '#/composables/use-custom-select-options';
import { useAiScriptWriterFeatureStore } from '#/store/ai-script-writer';

import {
  defaultFormState,
  getDefaultGenresOptions,
  getDefaultLanguageOptions,
  getDefaultScriptTypeOptions,
  getDefaultTopicOptions,
} from './ai-script-writer.data';

const formState = useStorage(
  'ai-script-writer-form-state',
  {
    ...defaultFormState,
  },
  undefined,
  {
    mergeDefaults: true,
  },
);

const store = useAiScriptWriterFeatureStore();
const { generatedScript, error, constructedPrompt, isGettingIdea, isLoading } =
  storeToRefs(store);
const { generateScript, getRandomIdea } = store;

async function handleGetRandomIdea() {
  const randomIdea = await getRandomIdea();
  if (randomIdea) {
    formApi.setValues({ idea: randomIdea });
  }
}

const formApiRef = ref<any>(null);

// --- Custom Select Options Logic ---

const defaultTopicOptions = getDefaultTopicOptions($t);
const defaultGenresOptions = getDefaultGenresOptions($t);
const defaultScriptTypeOptions = getDefaultScriptTypeOptions($t);
const defaultLanguageOptions = getDefaultLanguageOptions($t);

const { combinedOptions: topicOptions, handleChange: handleTopicChange } =
  useCustomSelectOptions('topic', defaultTopicOptions, formApiRef);
const { combinedOptions: genresOptions, handleChange: handleGenresChange } =
  useCustomSelectOptions('genres', defaultGenresOptions, formApiRef);
const {
  combinedOptions: mainCharacterOptions,
  handleChange: handleMainCharacterChange,
} = useCustomSelectOptions(
  'mainCharacter',
  ref<{ label: string; value: any }[]>([]),
  formApiRef,
);
const {
  combinedOptions: targetAudienceOptions,
  handleChange: handleTargetAudienceChange,
} = useCustomSelectOptions(
  'targetAudience',
  ref<{ label: string; value: any }[]>([]),
  formApiRef,
);
const {
  combinedOptions: scriptTypeOptions,
  handleChange: handleScriptTypeChange,
} = useCustomSelectOptions('scriptType', defaultScriptTypeOptions, formApiRef);
const { combinedOptions: languageOptions, handleChange: handleLanguageChange } =
  useCustomSelectOptions('language', defaultLanguageOptions, formApiRef);

const [Form, formApi] = useVbenForm({
  handleSubmit,
  layout: 'vertical',
  compact: true,
  actionPosition: 'center',
  actionButtonsReverse: true,
  actionLayout: 'newLine',
  wrapperClass: 'grid-cols-1 lg:grid-cols-6',
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
        placeholder: $t('page.aiScriptWriter.apiProvider.placeholder'),
        allowClear: true,
      },
      rules: 'required',
      help: $t('page.aiScriptWriter.apiProvider.help'),
    },
    {
      component: 'Textarea',
      fieldName: 'idea',
      label: () =>
        h('div', { class: 'flex w-full items-center justify-between' }, [
          h('span', $t('page.aiScriptWriter.idea.label')),
          h(
            Button,
            {
              size: 'small',
              type: 'dashed',
              onClick: handleGetRandomIdea,
              loading: isGettingIdea.value,
            },
            {
              icon: () => h(BulbOutlined),
              default: () => $t('page.aiScriptWriter.getRandomIdea'),
            },
          ),
        ]),
      componentProps: {
        placeholder: $t('page.aiScriptWriter.idea.placeholder'),
        rows: 1,
      },
      rules: 'required',
      formItemClass: 'lg:col-span-5',
      help: $t('page.aiScriptWriter.idea.help'),
    },
    {
      component: 'Select',
      fieldName: 'scriptType',
      label: $t('page.aiScriptWriter.scriptType.label'),
      componentProps: {
        class: 'w-full',
        mode: 'tags',
        options: scriptTypeOptions,
        onChange: handleScriptTypeChange,
      },
      rules: z.array(z.string()).nonempty(),
    },
    {
      component: 'Select',
      fieldName: 'topic',
      label: $t('page.aiScriptWriter.topic.label'),
      formItemClass: 'lg:col-span-2',
      componentProps: {
        class: 'w-full',
        allowClear: true,
        mode: 'tags',
        placeholder: $t('page.aiScriptWriter.topic.placeholder'),
        options: topicOptions,
        onChange: handleTopicChange,
      },
      help: $t('page.aiScriptWriter.topic.help'),
    },
    {
      component: 'Select',
      fieldName: 'language',
      label: $t('page.aiScriptWriter.language.label'),
      componentProps: {
        mode: 'tags',
        class: 'w-full',
        options: languageOptions,
        onChange: handleLanguageChange,
      },
      rules: z.array(z.string()).nonempty(),
      help: $t('page.aiScriptWriter.language.help'),
    },
    {
      component: 'Select',
      fieldName: 'genres',
      label: $t('page.aiScriptWriter.genres.label'),
      componentProps: {
        class: 'w-full',
        mode: 'tags',
        placeholder: $t('page.aiScriptWriter.genres.placeholder'),
        options: genresOptions,
        onChange: handleGenresChange,
      },
      help: $t('page.aiScriptWriter.genres.help'),
    },
    {
      component: 'InputNumber',
      fieldName: 'expectedDuration',
      label: $t('page.aiScriptWriter.expectedDuration.label'),
      componentProps: {
        class: 'w-full',
        min: 0.5,
        max: 60,
        step: 0.5,
        addonAfter: $t('page.aiScriptWriter.expectedDuration.addon'),
      },
    },
    {
      component: 'Select',
      fieldName: 'mainCharacter',
      label: $t('page.aiScriptWriter.mainCharacter.label'),
      componentProps: {
        placeholder: $t('page.aiScriptWriter.mainCharacter.placeholder'),
        mode: 'tags',
        class: 'w-full',
        allowClear: true,
        options: mainCharacterOptions,
        onChange: handleMainCharacterChange,
      },
    },
    {
      component: 'Input',
      fieldName: 'context',
      label: $t('page.aiScriptWriter.context.label'),
      componentProps: {
        placeholder: $t('page.aiScriptWriter.context.placeholder'),
      },
    },
    {
      component: 'Select',
      fieldName: 'targetAudience',
      label: $t('page.aiScriptWriter.targetAudience.label'),
      componentProps: {
        placeholder: $t('page.aiScriptWriter.targetAudience.placeholder'),
        mode: 'tags',
        class: 'w-full',
        allowClear: true,
        options: targetAudienceOptions,
        onChange: handleTargetAudienceChange,
      },
    },
    {
      component: 'Input',
      fieldName: 'callToAction',
      label: $t('page.aiScriptWriter.callToAction.label'),
      componentProps: {
        placeholder: $t('page.aiScriptWriter.callToAction.placeholder'),
      },
      help: $t('page.aiScriptWriter.callToAction.help'),
    },
    {
      component: 'Switch',
      fieldName: 'generateImage',
      label: $t('page.aiScriptWriter.generateImage.label'),
      help: $t('page.aiScriptWriter.generateImage.help'),
    },
    {
      component: 'Switch',
      fieldName: 'textLayout',
      label: $t('page.aiScriptWriter.textLayout.label'),
      help: $t('page.aiScriptWriter.textLayout.help'),
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
  handleValuesChange(values) {
    formState.value = values as typeof defaultFormState;
  },
  handleReset() {
    formState.value = { ...defaultFormState };
    formApi.setValues(formState.value);
  },
});

onMounted(() => {
  formApi.setValues(formState.value);
});

formApiRef.value = formApi;

async function handleSubmit(values: Record<string, any>) {
  await generateScript();
  if (!error.value) {
    message.success({
      content: $t('page.aiScriptWriter.generatedScript.submitted', {
        idea: values.idea,
      }),
    });
  }
}
</script>

<template>
  <Page
    :description="$t('page.aiScriptWriter.description')"
    :title="$t('page.aiScriptWriter.title')"
  >
    <Card size="small" :title="$t('page.aiScriptWriter.cardTitle')">
      <Form />
    </Card>

    <!-- Generated Script -->
    <Card
      v-if="generatedScript || isLoading || error"
      class="mt-4"
      size="small"
    >
      <template #title>
        <span v-if="error">Error</span>
        <span v-else-if="isLoading">{{
          $t('page.aiScriptWriter.generatingTip')
        }}</span>
        <span v-else>{{
          $t('page.aiScriptWriter.generatedScript.title')
        }}</span>
      </template>
      <pre v-if="generatedScript" class="whitespace-pre-wrap">{{
        generatedScript
      }}</pre>
      <p v-if="error" class="text-red-500">{{ error }}</p>
    </Card>

    <pre class="mt-4 rounded bg-gray-100 p-4 dark:bg-gray-800">{{
      constructedPrompt
    }}</pre>
  </Page>
</template>
