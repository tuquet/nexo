<!-- eslint-disable vue/html-closing-bracket-newline -->
<!-- eslint-disable prettier/prettier -->
<script lang="ts" setup>
import type { ScriptJob } from './ai-script-writer.data';

import { onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

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
        <Card :title="$t('page.aiScriptWriter.detail.parametersTitle')">
          <Descriptions bordered :column="2" size="small">
            <Descriptions.Item
              :label="$t('page.aiScriptWriter.idea.label')"
              :span="2"
            >
              {{ job.idea }}
            </Descriptions.Item>
            <Descriptions.Item
              :label="$t('page.aiScriptWriter.apiProvider.label')"
            >
              <Tag color="blue">{{ job.apiProvider }}</Tag>
            </Descriptions.Item>
            <Descriptions.Item
              :label="$t('page.aiScriptWriter.temperature.label')"
            >
              {{ job.temperature }}
            </Descriptions.Item>
            <Descriptions.Item
              :label="$t('page.aiScriptWriter.expectedDuration.label')"
            >
              {{ job.expectedDuration }}
              {{ $t('page.aiScriptWriter.expectedDuration.addon') }}
            </Descriptions.Item>
            <Descriptions.Item
              v-if="job.context"
              :label="$t('page.aiScriptWriter.context.label')"
              :span="job.context.length > 50 ? 2 : 1"
            >
              {{ job.context }}
            </Descriptions.Item>

            <Descriptions.Item
              :label="$t('page.aiScriptWriter.scriptType.label')"
              :span="2"
            >
              <Tag v-for="item in job.scriptType" :key="item" color="cyan">
                {{ item }}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item
              :label="$t('page.aiScriptWriter.language.label')"
              :span="2"
            >
              <Tag v-for="item in job.language" :key="item" color="geekblue">
                {{ item }}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item
              v-if="job.genres?.length"
              :label="$t('page.aiScriptWriter.genres.label')"
              :span="2"
            >
              <Tag v-for="item in job.genres" :key="item" color="purple">
                {{ item }}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card :title="$t('page.aiScriptWriter.detail.scriptContentTitle')">
          <!-- Structured JSON content rendering -->
          <div v-if="job.structuredContent" class="space-y-4">
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
                      :label="$t('page.aiScriptWriter.detail.sceneDialogue')"
                    >
                      <div
                        v-for="(dialog, dIndex) in scene.dialogue"
                        :key="dIndex"
                        class="mb-2"
                      >
                        <span class="font-bold">{{ dialog.character }}:</span>
                        {{ dialog.line }}
                      </div>
                    </Descriptions.Item>
                  </Descriptions>
                </div>

                <!-- Right Column: Image Suggestion for this Scene -->
                <div v-if="job.structuredContent.image_suggestions?.[index]">
                  <Card
                    :title="$t('page.aiScriptWriter.detail.imageSuggestions')"
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
                        :style="{ maxHeight: '300px', objectFit: 'cover' }"
                      />
                      <p class="text-xs italic text-gray-500">
                        {{
                          job.structuredContent.image_suggestions[index]
                            .description
                        }}
                      </p>
                    </div>
                    <!-- Show suggestion and generate button if no image yet -->
                    <div v-else class="flex items-start justify-between gap-2">
                      <p class="flex-1">
                        {{
                          job.structuredContent.image_suggestions[index]
                            .description
                        }}
                      </p>
                      <Tooltip
                        :title="$t('page.aiScriptWriter.generateImage.label')"
                      >
                        <Button
                          shape="circle"
                          @click="
                            handleGenerateImage(
                              job.structuredContent.image_suggestions[index],
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
            <!-- Full Script Text (if available in structured content) -->
            <div v-if="job.structuredContent.full_script_text" class="mt-4">
              <Collapse>
                <Collapse.Panel
                  :header="$t('page.aiScriptWriter.detail.fullScriptText')"
                  key="fulltext"
                >
                  <pre class="whitespace-pre-wrap">{{
                    job.structuredContent.full_script_text
                  }}</pre>
                </Collapse.Panel>
              </Collapse>
            </div>
          </div>

          <!-- Raw text content rendering -->
          <div
            v-else
            class="bg-accent text-accent-foreground max-h-[70vh] overflow-y-auto whitespace-pre-wrap rounded p-4"
          >
            {{ job.scriptContent || 'Không có nội dung kịch bản.' }}
          </div>
        </Card>

        <Collapse>
          <Collapse.Panel
            :header="$t('page.aiScriptWriter.detail.rawPromptTitle')"
            key="1"
          >
            <pre class="whitespace-pre-wrap">{{ job.rawPrompt }}</pre>
          </Collapse.Panel>
        </Collapse>
      </div>
      <div v-else-if="!isLoading" class="text-center">
        <p>{{ $t('page.aiScriptWriter.detail.notFound') }}</p>
      </div>
    </Spin>
  </Page>
</template>
