<!-- eslint-disable vue/html-closing-bracket-newline -->
<!-- eslint-disable prettier/prettier -->
<script lang="ts" setup>
import type { ScriptJob } from './ai-script-writer.data';

import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';

import { JsonViewer, Page } from '@vben/common-ui';

import { PictureOutlined } from '@ant-design/icons-vue';
import {
  Button,
  Card,
  Collapse,
  Descriptions,
  Image,
  message,
  Spin,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import { db } from '#/lib/db';
import { $t } from '#/locales';

const route = useRoute();
const job = ref<ScriptJob | undefined>(undefined);
const isLoading = ref(true);
const generatedImages = reactive<Record<number, string>>({});
const activeCollapseKeys = ref(['1']);

const descriptionItems = computed(() => {
  if (!job.value) {
    return [];
  }
  const j = job.value;
  const items = [
    {
      labelKey: 'page.aiScriptWriter.idea.label',
      value: j.idea,
      span: 2,
      type: 'text',
    },
    {
      labelKey: 'page.aiScriptWriter.apiProvider.label',
      value: j.apiProvider,
      type: 'tag',
      color: 'blue',
    },
    {
      labelKey: 'page.aiScriptWriter.temperature.label',
      value: j.temperature,
      type: 'text',
    },
    {
      labelKey: 'page.aiScriptWriter.expectedDuration.label',
      value: j.expectedDuration,
      type: 'duration',
    },
    {
      labelKey: 'page.aiScriptWriter.context.label',
      value: j.context,
      span: j.context && j.context.length > 50 ? 2 : 1,
      type: 'text',
      show: !!j.context,
    },
    {
      labelKey: 'page.aiScriptWriter.scriptType.label',
      value: j.scriptType,
      span: 2,
      type: 'tags',
      color: 'cyan',
    },
    {
      labelKey: 'page.aiScriptWriter.language.label',
      value: j.language,
      span: 2,
      type: 'tags',
      color: 'geekblue',
    },
    {
      labelKey: 'page.aiScriptWriter.genres.label',
      value: j.genres,
      span: 2,
      type: 'tags',
      color: 'purple',
      show: j.genres && j.genres.length > 0,
    },
  ];

  return items.filter((item) => item.show !== false);
});

const usageMetadata = computed(() => {
  if (!job.value?.rawResponse) {
    return null;
  }
  const raw = job.value.rawResponse as any;

  // Gemini
  if (raw.usageMetadata) {
    return {
      promptTokens: raw.usageMetadata.promptTokenCount,
      completionTokens: raw.usageMetadata.candidatesTokenCount,
      totalTokens: raw.usageMetadata.totalTokenCount,
    };
  }

  // OpenAI
  if (raw.usage) {
    return {
      promptTokens: raw.usage.prompt_tokens,
      completionTokens: raw.usage.completion_tokens,
      totalTokens: raw.usage.total_tokens,
    };
  }

  return null;
});

function findOptionLabel(labelKey: string, optionValue: any): string {
  const baseKey = labelKey.replace(/\.label$/, '');
  const i18nKey = `${baseKey}.options.${optionValue}`;
  const translated = $t(i18nKey);
  return translated === i18nKey ? optionValue : translated;
}

function handleGenerateImage(suggestion: any, index: number) {
  // Fake image generation
  const fakeImageUrl =
    'https://images.unsplash.com/photo-1757877536122-35e42aa0b10b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxfHx8ZW58MHx8fHx8';
  generatedImages[index] = fakeImageUrl;
  message.success(`Đã tạo ảnh cho: "${suggestion.description}"`);
}

onMounted(async () => {
  const jobId = route.params.id as string;
  if (jobId) {
    try {
      job.value = await db.scriptJobs.get(jobId);
    } catch (error) {
      console.error('Failed to fetch job details:', error);
      job.value = undefined;
    } finally {
      isLoading.value = false;
    }
  } else {
    isLoading.value = false;
  }
});
</script>

<template>
  <Page
    :title="job?.idea || $t('page.aiScriptWriter.detail.title')"
    :description="$t('page.aiScriptWriter.detail.description')"
    content-class="p-5"
  >
    <Spin :spinning="isLoading">
      <div v-if="job" class="space-y-6">
        <Collapse v-model:active-key="activeCollapseKeys">
          <Collapse.Panel
            :header="$t('page.aiScriptWriter.detail.scriptContentTitle')"
            key="1"
          >
            <!-- Structured JSON content rendering -->
            <div v-if="job.structuredContent" class="space-y-4">
              <!-- Common Title and Logline -->
              <Card size="small">
                <Descriptions bordered :column="1" size="small">
                  <Descriptions.Item
                    :label="$t('page.aiScriptWriter.detail.scriptTitle')"
                  >
                    <h2 class="text-xl font-bold">
                      {{ job.structuredContent.title }}
                    </h2>
                  </Descriptions.Item>
                  <Descriptions.Item
                    :label="$t('page.aiScriptWriter.detail.logline')"
                  >
                    <p class="italic">{{ job.structuredContent.logline }}</p>
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <!-- Render Scenes if they exist -->
              <template v-if="job.structuredContent.scenes?.length">
                <Card
                  v-for="(scene, index) in job.structuredContent.scenes"
                  :key="index"
                  :title="scene.title"
                  size="small"
                >
                  <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <!-- Left Column: Scene Details -->
                    <div>
                      <Descriptions
                        :column="1"
                        size="small"
                        layout="vertical"
                        bordered
                      >
                        <Descriptions.Item
                          :label="$t('page.aiScriptWriter.detail.sceneSetting')"
                        >
                          {{ scene.setting }}
                        </Descriptions.Item>
                        <Descriptions.Item
                          :label="$t('page.aiScriptWriter.detail.sceneAction')"
                        >
                          <p class="whitespace-pre-wrap">{{ scene.action }}</p>
                        </Descriptions.Item>
                        <Descriptions.Item
                          v-if="scene.dialogue?.length"
                          :label="
                            $t('page.aiScriptWriter.detail.sceneDialogue')
                          "
                        >
                          <div
                            v-for="(dialog, dIndex) in scene.dialogue"
                            :key="dIndex"
                            class="mb-2"
                          >
                            <span class="font-bold"
                              >{{ dialog.character }}:</span
                            >
                            {{ dialog.line }}
                          </div>
                        </Descriptions.Item>
                      </Descriptions>
                    </div>

                    <!-- Right Column: Image Suggestion for this Scene -->
                    <div
                      v-if="job.structuredContent.image_suggestions?.[index]"
                    >
                      <Card
                        :title="
                          $t('page.aiScriptWriter.detail.imageSuggestions')
                        "
                        size="small"
                      >
                        <!-- Show generated image if available -->
                        <div v-if="generatedImages[index]" class="space-y-2">
                          <Image
                            class="w-full overflow-hidden rounded-md"
                            :src="generatedImages[index]"
                            :alt="
                              job.structuredContent.image_suggestions[index]
                                .description
                            "
                            :style="{
                              maxHeight: '300px',
                              objectFit: 'cover',
                            }"
                          />
                          <p class="text-xs italic text-gray-500">
                            {{
                              job.structuredContent.image_suggestions[index]
                                .description
                            }}
                          </p>
                        </div>
                        <!-- Show suggestion and generate button if no image yet -->
                        <div
                          v-else
                          class="flex items-start justify-between gap-2"
                        >
                          <p class="flex-1">
                            {{
                              job.structuredContent.image_suggestions[index]
                                .description
                            }}
                          </p>
                          <Tooltip
                            :title="
                              $t('page.aiScriptWriter.generateImage.label')
                            "
                          >
                            <Button
                              shape="circle"
                              @click="
                                handleGenerateImage(
                                  job.structuredContent.image_suggestions[
                                    index
                                  ],
                                  index,
                                )
                              "
                            >
                              <template #icon>
                                <PictureOutlined />
                              </template>
                            </Button>
                          </Tooltip>
                        </div>
                      </Card>
                    </div>
                  </div>
                </Card>
              </template>
              <!-- Render full_script_text if it exists and scenes don't -->
              <Card
                v-else-if="job.structuredContent.full_script_text"
                :title="$t('page.aiScriptWriter.detail.fullScriptText')"
                size="small"
              >
                <div
                  class="bg-accent text-accent-foreground max-h-[70vh] overflow-y-auto whitespace-pre-wrap rounded p-4"
                >
                  {{ job.structuredContent.full_script_text }}
                </div>
              </Card>
            </div>

            <!-- Raw text content rendering -->
            <div
              v-else
              class="bg-accent text-accent-foreground max-h-[70vh] overflow-y-auto whitespace-pre-wrap rounded p-4"
            >
              {{ job.scriptContent || 'Không có nội dung kịch bản.' }}
            </div>
          </Collapse.Panel>

          <Collapse.Panel
            :header="$t('page.aiScriptWriter.detail.parametersTitle')"
            key="2"
          >
            <Card :title="$t('page.aiScriptWriter.detail.parametersTitle')">
              <Descriptions bordered :column="2" size="small">
                <Descriptions.Item
                  v-for="item in descriptionItems"
                  :key="item.labelKey"
                  :label="$t(item.labelKey)"
                  :span="item.span"
                >
                  <template v-if="item.type === 'text'">
                    {{ item.value }}
                  </template>
                  <template v-else-if="item.type === 'duration'">
                    {{ item.value }}
                    {{ $t('page.aiScriptWriter.expectedDuration.addon') }}
                  </template>
                  <template v-else-if="item.type === 'tag'">
                    <Tag :color="item.color">
                      {{ findOptionLabel(item.labelKey, item.value) }}
                    </Tag>
                  </template>
                  <template v-else-if="item.type === 'tags'">
                    <Tag
                      v-for="tagValue in item.value"
                      :key="tagValue"
                      :color="item.color"
                    >
                      {{ findOptionLabel(item.labelKey, tagValue) }}
                    </Tag>
                  </template>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Collapse.Panel>

          <Collapse.Panel
            :header="$t('page.aiScriptWriter.detail.rawPromptTitle')"
            key="3"
          >
            <pre class="whitespace-pre-wrap">{{ job.rawPrompt }}</pre>
          </Collapse.Panel>

          <Collapse.Panel
            v-if="job.rawResponse"
            :header="$t('page.aiScriptWriter.detail.rawResponseTitle')"
            key="4"
          >
            <div class="grid grid-cols-2">
              <JsonViewer :value="job.rawResponse" />

              <Descriptions
                v-if="usageMetadata"
                bordered
                :column="1"
                size="small"
              >
                <Descriptions.Item
                  :label="
                    $t('page.aiScriptWriter.detail.usageMetadata.promptTokens')
                  "
                >
                  {{ usageMetadata.promptTokens }}
                </Descriptions.Item>
                <Descriptions.Item
                  :label="
                    $t(
                      'page.aiScriptWriter.detail.usageMetadata.completionTokens',
                    )
                  "
                >
                  {{ usageMetadata.completionTokens }}
                </Descriptions.Item>
                <Descriptions.Item
                  :label="
                    $t('page.aiScriptWriter.detail.usageMetadata.totalTokens')
                  "
                >
                  <span class="font-bold">{{ usageMetadata.totalTokens }}</span>
                </Descriptions.Item>
              </Descriptions>
            </div>
          </Collapse.Panel>
        </Collapse>
      </div>
      <div v-else-if="!isLoading" class="text-center">
        <p>{{ $t('page.aiScriptWriter.detail.notFound') }}</p>
      </div>
    </Spin>
  </Page>
</template>
