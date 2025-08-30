<script setup lang="ts">
import { reactive, ref } from 'vue';

import {
  MinusCircleOutlined,
  PlusOutlined,
  SendOutlined,
} from '@ant-design/icons-vue';
import {
  Alert,
  Button,
  Card,
  Divider,
  Form,
  Input,
  InputNumber,
  Select,
  Spin,
  TypographyParagraph,
} from 'ant-design-vue';

const loading = ref(false);
const formState = reactive({
  apiProvider: 'Gemini',
  apiKey: '',
  storyType: 'YouTube Video',
  language: 'English',
  genres: ['Drama', 'Social'],
  mainCharacter: '',
  setting: '',
  pointOfView: 'Third Person',
  dialogueLevel: 'Moderate',
  wordCount: 500,
  topic: '',
  targetAudience: '',
  callToAction: '',
  segments: [
    {
      name: 'Intro / Hook',
      description: "Grab the viewer's attention in the first 5 seconds.",
    },
    {
      name: 'Main Content',
      description: 'Present the core information or story.',
    },
    { name: 'Outro', description: 'Summarize and include the call to action.' },
  ],
});

const generatedScript = ref('');

const apiProviders = ['Gemini', 'ChatGPT'];
const storyTypes = [
  'YouTube Video',
  'Short Film',
  'Vlog Outline',
  'Podcast Script',
];
const languages = ['English', 'Vietnamese'];
const genres = [
  'Drama',
  'Social',
  'Comedy',
  'Horror',
  'Sci-Fi',
  'Fantasy',
  'Action',
];
const pointsOfView = ['First Person', 'Third Person'];
const dialogueLevels = ['Low', 'Moderate', 'High'];

const removeSegment = (item: { description: string; name: string }) => {
  const index = formState.segments.indexOf(item);
  if (index !== -1) {
    formState.segments.splice(index, 1);
  }
};

const addSegment = () => {
  formState.segments.push({ name: '', description: '' });
};

const onFinish = async () => {
  loading.value = true;
  generatedScript.value = '';

  // This will be replaced with a real IPC call to the main process.
  // eslint-disable-next-line no-console
  console.log('Submitting script generation request with data:', {
    ...formState,
  });

  // Simulate an API call for demonstration purposes.
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // A simple confirmation message for the UI
  generatedScript.value = `Request submitted for topic: "${formState.topic}". Check console for details.`;

  loading.value = false;
};
</script>

<template>
  <div class="mx-auto max-w-4xl p-5">
    <Card title="AI Script Writer">
      <div>
        <Alert
          type="info"
          show-icon
          class="mb-5"
          message="AI-Powered Script Generation"
          description="Fill in the details below to generate a unique video script. The more context you provide, the better the result."
          closable
        />
        <Form :model="formState" layout="vertical" @finish="onFinish">
          <!-- API Configuration -->
          <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Form.Item
              label="API Provider"
              name="apiProvider"
              class="md:col-span-1"
            >
              <Select v-model:value="formState.apiProvider" size="large">
                <Select.Option v-for="p in apiProviders" :key="p" :value="p">
                  {{ p }}
                </Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="API Key"
              name="apiKey"
              class="md:col-span-2"
              :rules="[{ required: true, message: 'API Key is required!' }]"
            >
              <Input.Password
                v-model:value="formState.apiKey"
                placeholder="Enter your API key"
                size="large"
              />
            </Form.Item>
          </div>

          <!-- Core Idea -->
          <Form.Item
            label="Video Topic / Main Idea"
            name="topic"
            :rules="[{ required: true, message: 'Please enter a topic!' }]"
          >
            <Input.TextArea
              v-model:value="formState.topic"
              placeholder="e.g., 'A short film about a robot who discovers music for the first time.'"
              :rows="3"
            />
          </Form.Item>

          <!-- Script Parameters -->
          <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Form.Item label="Script Type" name="storyType">
              <Select v-model:value="formState.storyType" size="large">
                <Select.Option v-for="st in storyTypes" :key="st" :value="st">
                  {{ st }}
                </Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="Language" name="language">
              <Select v-model:value="formState.language" size="large">
                <Select.Option
                  v-for="lang in languages"
                  :key="lang"
                  :value="lang"
                >
                  {{ lang }}
                </Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="Genre(s)" name="genres">
              <Select
                v-model:value="formState.genres"
                mode="tags"
                placeholder="Select or type genres"
                size="large"
                :options="genres.map((g) => ({ value: g }))"
              />
            </Form.Item>
          </div>

          <!-- Optional Details -->
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Form.Item
              label="Main Character Name (Optional)"
              name="mainCharacter"
            >
              <Input
                v-model:value="formState.mainCharacter"
                placeholder="e.g., 'Alex'"
                size="large"
              />
            </Form.Item>
            <Form.Item label="Setting / Context (Optional)" name="setting">
              <Input
                v-model:value="formState.setting"
                placeholder="e.g., 'A small, rain-slicked alley in a futuristic city'"
                size="large"
              />
            </Form.Item>
          </div>

          <!-- Style & Length -->
          <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Form.Item label="Point of View" name="pointOfView">
              <Select v-model:value="formState.pointOfView" size="large">
                <Select.Option
                  v-for="pov in pointsOfView"
                  :key="pov"
                  :value="pov"
                >
                  {{ pov }}
                </Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="Dialogue Level" name="dialogueLevel">
              <Select v-model:value="formState.dialogueLevel" size="large">
                <Select.Option
                  v-for="dl in dialogueLevels"
                  :key="dl"
                  :value="dl"
                >
                  {{ dl }}
                </Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="Suggested Length (words)" name="wordCount">
              <InputNumber
                v-model:value="formState.wordCount"
                :min="100"
                :step="50"
                class="w-full"
                size="large"
              />
            </Form.Item>
          </div>

          <Divider>Advanced Options</Divider>

          <!-- Script Structure -->
          <div
            v-for="(segment, index) in formState.segments"
            :key="index"
            class="mb-4"
          >
            <label class="mb-2 block font-semibold">
              Segment {{ index + 1 }}
            </label>
            <div class="flex items-start gap-2">
              <div class="flex-grow">
                <Form.Item
                  :name="['segments', index, 'name']"
                  :rules="{
                    required: true,
                    message: 'Segment name is required',
                  }"
                >
                  <Input
                    v-model:value="segment.name"
                    placeholder="Segment Name (e.g., Intro)"
                    size="large"
                  />
                </Form.Item>
                <Form.Item :name="['segments', index, 'description']">
                  <Input.TextArea
                    v-model:value="segment.description"
                    placeholder="Briefly describe what happens in this segment."
                    :rows="2"
                  />
                </Form.Item>
              </div>
              <Button
                v-if="formState.segments.length > 1"
                type="dashed"
                danger
                @click="removeSegment(segment)"
              >
                <template #icon><MinusCircleOutlined /></template>
              </Button>
            </div>
          </div>
          <Form.Item>
            <Button type="dashed" block size="large" @click="addSegment">
              <template #icon><PlusOutlined /></template>
              Add Segment
            </Button>
          </Form.Item>

          <!-- Audience and CTA -->
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Form.Item label="Target Audience (Optional)" name="targetAudience">
              <Input
                v-model:value="formState.targetAudience"
                placeholder="e.g., 'Beginner programmers'"
                size="large"
              />
            </Form.Item>
            <Form.Item label="Call to Action (Optional)" name="callToAction">
              <Input
                v-model:value="formState.callToAction"
                placeholder="e.g., 'Like and subscribe!'"
                size="large"
              />
            </Form.Item>
          </div>

          <Form.Item>
            <Button
              type="primary"
              html-type="submit"
              :loading="loading"
              size="large"
              block
            >
              <template #icon>
                <SendOutlined />
              </template>
              Generate Script
            </Button>
          </Form.Item>
        </Form>

        <div v-if="loading" class="text-center">
          <Spin size="large" tip="The AI is thinking... Please wait." />
        </div>

        <div
          v-if="generatedScript && !loading"
          class="mt-5 rounded-lg bg-gray-100 p-5 dark:bg-gray-700"
        >
          <h3 class="mb-4 text-lg font-semibold">Generated Script:</h3>
          <TypographyParagraph>
            <pre class="whitespace-pre-wrap font-sans">{{
              generatedScript
            }}</pre>
          </TypographyParagraph>
        </div>
      </div>
    </Card>
  </div>
</template>
