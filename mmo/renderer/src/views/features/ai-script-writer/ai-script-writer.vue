<script lang="ts" setup>
import type { Ref } from 'vue';

import type { AiScriptResponse, ScriptJob } from './ai-script-writer.data';

import type { VxeGridProps } from '#/adapter/vxe-table';

import { computed, h, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { Page, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import {
  BulbOutlined,
  CopyOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileTextOutlined,
  RedoOutlined,
  SendOutlined,
} from '@ant-design/icons-vue';
import { until, useClipboard, useStorage } from '@vueuse/core';
import { Alert, Button, message, Modal, Tag, Tooltip } from 'ant-design-vue';
import { storeToRefs } from 'pinia';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCustomSelectOptions } from '#/composables/useCustomSelectOptions';
import { db } from '#/lib/db';
import { generateScriptContent } from '#/services/ai.api';
import { useAiScriptWriterFeatureStore } from '#/store/ai-script-writer';

import {
  defaultFormState,
  getApiProviderOptions,
  getDefaultGenresOptions,
  getDefaultLanguageOptions,
  getDefaultScriptTypeOptions,
  getDefaultTopicOptions,
} from './ai-script-writer.data';
import { useAiPrompt } from './useAiPrompt';

// --- State Management ---
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

const isPromptModalVisible = ref(false);
const isFormParamsModalVisible = ref(false);
const currentJobForParams = ref<null | ScriptJob>(null);

async function loadJobHistory() {
  try {
    const jobs = await db.scriptJobs.orderBy('createdAt').reverse().toArray();
    const { grid } = gridApi;
    if (grid) {
      grid.loadData(jobs);
    }
  } catch (error) {
    console.error('Failed to load job history:', error);
    message.error('Không thể tải lịch sử công việc.');
  }
}

const store = useAiScriptWriterFeatureStore();
const { isGettingIdea } = storeToRefs(store);
const { getRandomIdea } = store;

const formattedFormParams = computed(() => {
  if (!currentJobForParams.value) return '';
  const {
    scriptContent: _scriptContent,
    rawPrompt: _rawPrompt,
    structuredContent: _structuredContent,
    error: _error,
    ...params
  } = currentJobForParams.value;
  return JSON.stringify(params, null, 2);
});

const router = useRouter();
const { constructedPrompt } = useAiPrompt(formState);

// --- Form & Schema Definition ---

const formApiRef = ref<any>(null);

// Helper to set up custom select fields that allow user-added tags
function buildProps(
  fieldName: keyof typeof defaultFormState,
  defaultOptions: Ref<{ label: string; value: any }[]>,
) {
  const { combinedOptions, handleChange } = useCustomSelectOptions(
    fieldName,
    defaultOptions,
    formApiRef,
  );
  return { options: combinedOptions, onChange: handleChange };
}

type Options = { label: string; value: any };
const apiProviderProps = buildProps('apiProvider', getApiProviderOptions());
const topicProps = buildProps('topic', getDefaultTopicOptions());
const genresProps = buildProps('genres', getDefaultGenresOptions());
const mainCharacterProps = buildProps('mainCharacter', ref<Options[]>([]));
const targetAudienceProps = buildProps('targetAudience', ref<Options[]>([]));
const scriptTypeProps = buildProps('scriptType', getDefaultScriptTypeOptions());
const languageProps = buildProps('language', getDefaultLanguageOptions());

// Encapsulate schema creation to improve readability
function createFormSchema() {
  return [
    {
      component: 'Select',
      fieldName: 'apiProvider',
      label: $t('page.aiScriptWriter.apiProvider.label'),
      componentProps: {
        class: 'w-full',
        placeholder: $t('page.aiScriptWriter.apiProvider.placeholder'),
        allowClear: true,
        ...apiProviderProps,
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
        ...scriptTypeProps,
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
        ...topicProps,
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
        ...languageProps,
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
        ...genresProps,
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
        ...mainCharacterProps,
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
        ...targetAudienceProps,
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
      componentProps: {
        class: 'w-auto',
      },
    },
    {
      component: 'Switch',
      fieldName: 'textLayout',
      label: $t('page.aiScriptWriter.textLayout.label'),
      help: $t('page.aiScriptWriter.textLayout.help'),
      componentProps: {
        class: 'w-auto',
      },
    },
    {
      component: 'Switch',
      fieldName: 'jsonOutput',
      label: $t('page.aiScriptWriter.jsonOutput.label'),
      help: $t('page.aiScriptWriter.jsonOutput.help'),
      componentProps: {
        class: 'w-auto',
      },
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
      help: $t('page.aiScriptWriter.temperature.help'),
    },
  ];
}

const gridOptions: VxeGridProps<ScriptJob> = {
  autoResize: true,
  border: true,
  columns: [
    {
      field: 'idea',
      title: $t('page.aiScriptWriter.idea.label'),
      minWidth: 200,
      showOverflow: 'tooltip',
      slots: { default: 'idea' },
    },
    {
      title: $t('page.aiScriptWriter.table.formParams'),
      width: 100,
      align: 'center',
      slots: { default: 'formParams' },
    },
    {
      field: 'rawPrompt',
      title: $t('page.aiScriptWriter.table.rawPrompt'),
      minWidth: 250,
      showOverflow: 'tooltip',
    },
    {
      field: 'status',
      title: $t('page.aiScriptWriter.table.status'),
      width: 120,
      slots: { default: 'status' },
    },
    {
      field: 'createdAt',
      title: $t('page.aiScriptWriter.table.createdAt'),
      width: 180,
    },
    {
      title: $t('page.aiScriptWriter.table.action'),
      width: 150,
      slots: { default: 'action' },
      fixed: 'right',
      align: 'center',
    },
  ],
  // Data is loaded imperatively via loadJobHistory to ensure grid is ready.
  height: 'auto',
  pagerConfig: { enabled: false },
  size: 'small',
  rowConfig: {
    keyField: 'id',
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions,
  formOptions: {
    handleSubmit,
    handleValuesChange,
    handleReset,
    layout: 'vertical',
    compact: true,
    actionPosition: 'center',
    actionButtonsReverse: true,
    actionLayout: 'newLine',
    wrapperClass: 'grid-cols-1 lg:grid-cols-6',
    schema: createFormSchema(),
    submitButtonOptions: {
      innerText: $t('page.aiScriptWriter.submit'),
      slots: {
        icon: () => h(SendOutlined),
      },
    },
  },
});

const { copy: copyPrompt } = useClipboard({
  source: constructedPrompt,
  legacy: true,
});

watch(
  () => gridApi.formApi,
  (api) => (formApiRef.value = api),
);

async function processJob(job: ScriptJob): Promise<void> {
  const row = gridApi.grid?.getRowById(job.id);
  if (!row) {
    // If the row is not in the grid, it might be a new job.
    // The UI will update on the next full load, but for now, we can proceed.
    console.warn(`Job with id ${job.id} not found in grid for UI update.`);
  }

  await db.scriptJobs.update(job.id, { status: 'generating' });
  if (row) row.status = 'generating';

  // Wait for the prompt to be updated in the store
  // This is needed because form values might be set just before this call
  // and computed properties need a tick to update.
  await until(constructedPrompt).not.toBe('');

  const result = await generateScriptContent({
    prompt: constructedPrompt.value,
    provider: job.apiProvider,
    temperature: job.temperature,
  });

  if (result.error) {
    await db.scriptJobs.update(job.id, {
      status: 'failed',
      error: result.error,
    });
    if (row) {
      Object.assign(row, { status: 'failed', error: result.error });
    }
  } else {
    let scriptTextForDisplay = result.content;
    let structuredData: AiScriptResponse | undefined;

    try {
      // Regex để bắt JSON trong ```json ... ``` hoặc trực tiếp { ... }
      const jsonRegex = /```json\n([\s\S]*?)\n```|(\{[\s\S]*\})/;
      const match = result.content.match(jsonRegex);

      if (match) {
        const jsonString = match[1] ?? match[2];
        structuredData = JSON.parse(jsonString || '');

        // Ưu tiên full_script_text, fallback sang stringify toàn bộ JSON
        scriptTextForDisplay =
          structuredData?.full_script_text ??
          JSON.stringify(structuredData, null, 2);
      } else {
        console.warn('AI response did not contain a recognizable JSON object.');
        structuredData = undefined;
      }
    } catch (error) {
      console.error(
        'Failed to parse JSON from AI response. Using raw content.',
        error,
      );
      structuredData = undefined;
    }

    await db.scriptJobs.update(job.id, {
      status: 'success',
      scriptContent: scriptTextForDisplay,
      structuredContent: structuredData, // structuredData can be undefined here
    });
    if (row) {
      Object.assign(row, {
        status: 'success',
        scriptContent: scriptTextForDisplay,
        structuredContent: structuredData,
      });
    }
    message.success(
      $t('page.aiScriptWriter.generatedScript.submitted', {
        idea: job.idea ?? '', // Fix: Ensure job.idea is a string
      }),
    );
  }
}

// --- Event Handlers ---
async function handleSubmit(values: Record<string, any>): Promise<void> {
  // Use JSON stringify/parse to create a deep, plain clone, avoiding DataCloneError with Vue proxies.
  // structuredClone is preferred but fails on Vue's reactive proxies.
  // eslint-disable-next-line unicorn/prefer-structured-clone
  const plainValues = JSON.parse(JSON.stringify(values));
  const newJob: ScriptJob = {
    ...(plainValues as typeof defaultFormState),
    id: `script-${Date.now()}`,
    status: 'pending',
    rawPrompt: constructedPrompt.value,
    createdAt: new Date().toLocaleString(),
  };
  await db.scriptJobs.add(newJob);
  await gridApi.grid?.insert(newJob);
  processJob(newJob);
}

function handleValuesChange(values: Record<string, any>) {
  formState.value = values as typeof defaultFormState;
}

function handleReset() {
  formState.value = { ...defaultFormState };
  gridApi.formApi.setValues(formState.value);
}

async function handleCopyPrompt() {
  await copyPrompt();
  message.success($t('page.common.copySuccess'));
}

async function handleGetRandomIdea() {
  const randomIdea = await getRandomIdea();
  if (randomIdea) {
    gridApi.formApi.setValues({ idea: randomIdea });
  }
}

function viewScript(job: ScriptJob) {
  Modal.info({
    title: $t('page.aiScriptWriter.generatedScript.title'),
    content: h(
      'pre',
      { class: 'max-h-[60vh] overflow-y-auto whitespace-pre-wrap' },
      job.scriptContent || 'Không có nội dung.',
    ),
    width: '80%',
  });
}

function showFormParams(job: ScriptJob) {
  currentJobForParams.value = job;
  isFormParamsModalVisible.value = true;
}

function goToDetails(job: ScriptJob) {
  router.push({ name: 'AIGeneratedScriptDetail', params: { id: job.id } });
}

function removeJob(job: ScriptJob) {
  db.scriptJobs.delete(job.id);
  gridApi.grid?.remove(job);
}

async function retryJob(job: ScriptJob): Promise<void> {
  // Restore form state from the job. This will trigger `handleValuesChange`
  // which updates the pinia store that `generateScript` depends on.
  gridApi.formApi.setValues(job);
  const row = gridApi.grid?.getRowById(job.id);
  if (row) {
    await db.scriptJobs.update(job.id, { status: 'pending', error: undefined });
    row.status = 'pending';
    row.error = undefined;
    processJob(row);
  }
}

const getStatusColor = (status: ScriptJob['status']) => {
  switch (status) {
    case 'failed': {
      return 'error';
    }
    case 'generating': {
      return 'processing';
    }
    case 'pending': {
      return 'default';
    }
    case 'success': {
      return 'success';
    }
    default: {
      return 'default';
    }
  }
};

onMounted(() => {
  gridApi.formApi.setValues(formState.value);
  loadJobHistory();
});
</script>

<template>
  <Page
    :description="$t('page.aiScriptWriter.description')"
    :title="$t('page.aiScriptWriter.title')"
    :auto-content-height="true"
  >
    <template #extra>
      <Button type="primary" @click="isPromptModalVisible = true">
        {{ $t('page.aiScriptWriter.promptPreview.title') }}
      </Button>
      <Modal v-model:open="isPromptModalVisible" width="80%" :footer="null">
        <template #title>
          <div class="flex items-center justify-between">
            <span>{{ $t('page.aiScriptWriter.promptPreview.title') }}</span>
            <Button @click="handleCopyPrompt" class="mr-5">
              <template #icon>
                <CopyOutlined />
              </template>
              {{ $t('page.common.copy') }}
            </Button>
          </div>
        </template>
        <pre class="max-h-[70vh] overflow-y-auto whitespace-pre-wrap">{{
          constructedPrompt
        }}</pre>
      </Modal>
    </template>
    <Modal
      v-model:open="isFormParamsModalVisible"
      :title="$t('page.aiScriptWriter.formParamsModalTitle')"
      width="60%"
      :footer="null"
    >
      <pre
        v-if="currentJobForParams"
        class="max-h-[70vh] overflow-y-auto whitespace-pre-wrap"
        >{{ formattedFormParams }}
      </pre>
    </Modal>
    <Grid>
      <template #idea="{ row }">
        <Tooltip placement="topLeft">
          <template #title>
            <pre class="max-h-60 overflow-y-auto whitespace-pre-wrap">{{
              row.rawPrompt
            }}</pre>
          </template>
          <span>{{ row.idea }}</span>
        </Tooltip>
      </template>
      <template #formParams="{ row }">
        <Button type="link" size="small" @click="showFormParams(row)">
          {{ $t('page.common.view') }}
        </Button>
      </template>
      <template #status="{ row: record }">
        <div v-if="record.status === 'failed' && record.error">
          <Alert
            type="error"
            :message="record.error"
            :show-icon="false"
            class="p-1"
          />
        </div>
        <Tag v-else :color="getStatusColor(record.status)">
          {{ $t(`page.aiScriptWriter.status.${record.status}`) }}
        </Tag>
      </template>
      <template #action="{ row: record }">
        <div class="flex flex-wrap items-center justify-center gap-2">
          <Button
            v-if="record.status === 'success'"
            type="primary"
            size="small"
            @click="viewScript(record)"
          >
            <template #icon>
              <EyeOutlined />
            </template>
          </Button>
          <Button
            v-if="record.status === 'failed'"
            size="small"
            @click="retryJob(record)"
          >
            <template #icon>
              <RedoOutlined />
            </template>
          </Button>
          <Button type="default" size="small" @click="goToDetails(record)">
            <template #icon>
              <FileTextOutlined />
            </template>
          </Button>
          <Button type="dashed" danger size="small" @click="removeJob(record)">
            <template #icon>
              <DeleteOutlined />
            </template>
          </Button>
        </div>
      </template>
    </Grid>
  </Page>
</template>
