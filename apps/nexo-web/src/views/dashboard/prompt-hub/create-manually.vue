<script setup lang="ts">
import type { PromptHub, Tag } from '#/lib/db/prompt-schema';

import { computed, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { useObservable } from '@vueuse/rxjs';
import {
  Button,
  Card,
  Form,
  Input,
  message,
  Radio,
  Switch,
} from 'ant-design-vue';
import { liveQuery } from 'dexie';
import { from } from 'rxjs';

import DynamicSelect from '#/components/common/DynamicSelect.vue';
import { db } from '#/lib/db';

import VideoScriptTemplate from './video-script-template.vue';

const emit = defineEmits(['update:prompt-preview']);
const FormItem = Form.Item;
const Textarea = Input.TextArea;

const router = useRouter();

// Chuyển sang dùng Radio để dễ mở rộng các loại template
const promptMode = ref('manual'); // 'manual' | 'videoTemplate'

// Tạo các biến riêng để lưu trạng thái cho mỗi chế độ
const manualPrompt = ref('');
const templatePrompt = ref('');

// Lấy danh sách tất cả các tag đã có từ DB để làm gợi ý
const existingTags = useObservable<Tag[]>(
  from(liveQuery(() => db.tags.toArray())),
  { initialValue: undefined },
);

const formState = reactive<{
  promptData: Omit<PromptHub, 'date' | 'id'>;
  tags: string[];
}>({
  promptData: {
    title: '',
    description: '',
    prompt: '',
    isFavorite: false,
  },
  tags: [],
});

// Chuyển đổi mảng string thành định dạng options cho DynamicSelect
const tagOptions = computed(() => {
  return existingTags.value || [];
});

const rules = {
  title: [{ required: true, message: 'Vui lòng nhập tiêu đề!' }],
  prompt: [{ required: true, message: 'Vui lòng nhập nội dung prompt!' }],
};

async function handleSubmit() {
  const { promptData, tags: tagNames } = formState;

  try {
    // 1. Thêm prompt chính và lấy ID
    const promptId = await db.promptHubs.add({
      ...promptData,
      prompt: formState.promptData.prompt, // Đảm bảo prompt được truyền đúng
      date: new Date().toISOString(),
    });

    if (tagNames && tagNames.length > 0) {
      // 2. Xử lý các tags: thêm tag mới nếu chưa có, lấy ID của tất cả
      const tagIds = await Promise.all(
        tagNames.map(async (name: string) => {
          const tag = await db.tags
            .where('name')
            .equalsIgnoreCase(name)
            .first();
          if (!tag) {
            // Nếu tag chưa tồn tại, thêm mới
            const newTagId = await db.tags.add({ name });
            return newTagId;
          }
          return tag.id!;
        }),
      );

      // 3. Tạo các bản ghi liên kết trong bảng promptTags
      const promptTagLinks = tagIds.map((tagId: any) => ({
        promptId,
        tagId,
      }));
      await db.promptTags.bulkAdd(promptTagLinks);
    }

    message.success('Tạo prompt thành công!');
    router.push({ name: 'PromptHubList' });
  } catch (error) {
    console.error('Lỗi khi tạo prompt:', error);
    message.error('Có lỗi xảy ra khi tạo prompt.');
  }
}

// Gửi nội dung prompt ra component cha để hiển thị preview
watch(
  () => formState.promptData.prompt,
  (newValue) => emit('update:prompt-preview', newValue),
);

// Watch sự thay đổi của radio button
watch(promptMode, (newMode) => {
  // Khi chuyển sang chế độ template, cập nhật prompt chính bằng giá trị của template
  if (newMode === 'videoTemplate') {
    formState.promptData.prompt = templatePrompt.value;
  }
  // Khi chuyển về chế độ gõ tay, cập nhật prompt chính bằng giá trị của manual
  else if (newMode === 'manual') {
    formState.promptData.prompt = manualPrompt.value;
  }
});

// Đồng bộ prompt từ template vào formState khi có thay đổi
watch(templatePrompt, (newValue) => {
  if (promptMode.value === 'videoTemplate') {
    formState.promptData.prompt = newValue;
  }
});

// Đồng bộ prompt từ gõ tay vào formState khi có thay đổi
watch(manualPrompt, (newValue) => {
  if (promptMode.value === 'manual') {
    formState.promptData.prompt = newValue;
  }
});
</script>

<template>
  <Card title="Nhập thông tin Prompt">
    <Form
      :model="formState.promptData"
      :rules="rules"
      layout="vertical"
      @finish="handleSubmit"
    >
      <FormItem label="Tiêu đề" name="title">
        <Input
          v-model:value="formState.promptData.title"
          placeholder="Nhập tiêu đề"
        />
      </FormItem>

      <FormItem label="Mô tả" name="description">
        <Textarea
          v-model:value="formState.promptData.description"
          :rows="2"
          placeholder="Mô tả ngắn về prompt"
        />
      </FormItem>

      <FormItem label="Nội dung Prompt" name="prompt">
        <div>
          <Radio.Group
            v-model:value="promptMode"
            button-style="solid"
            class="mb-4"
          >
            <Radio.Button value="manual">Gõ tay</Radio.Button>
            <Radio.Button value="videoTemplate">Tạo từ mẫu Video</Radio.Button>
          </Radio.Group>

          <VideoScriptTemplate
            v-show="promptMode === 'videoTemplate'"
            v-model="templatePrompt"
          />
          <Textarea
            v-show="promptMode === 'manual'"
            v-model:value="manualPrompt"
            :rows="8"
            placeholder="Dán hoặc nhập nội dung prompt đầy đủ tại đây"
          />
        </div>
      </FormItem>

      <FormItem label="Tags (Thẻ phân loại)" name="tags">
        <DynamicSelect
          v-model:value="formState.tags"
          :options="tagOptions"
          label-field="name"
          value-field="name"
          mode="tags"
          placeholder="Chọn hoặc nhập tag mới và nhấn Enter"
        />
      </FormItem>

      <FormItem label="Yêu thích" name="isFavorite">
        <Switch v-model:checked="formState.promptData.isFavorite" />
      </FormItem>

      <FormItem>
        <Button html-type="submit" type="primary"> Lưu Prompt </Button>
      </FormItem>
    </Form>
  </Card>
</template>
