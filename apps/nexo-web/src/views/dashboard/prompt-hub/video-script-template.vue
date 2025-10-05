<script setup lang="ts">
import type {
  Format,
  LengthOption,
  OutputRequirement,
  PromptTemplate,
  ScriptType,
  Style,
  Topic,
} from '#/lib/db/prompt-schema';

import { computed, defineModel, ref, watch } from 'vue';

import { useObservable } from '@vueuse/rxjs';
import { Space } from 'ant-design-vue';
import { liveQuery } from 'dexie';
import { nanoid } from 'nanoid';
import { from } from 'rxjs';

import DynamicSelect from '#/components/common/DynamicSelect.vue';
import { db } from '#/lib/db';

const model = defineModel<string>();

const selections = ref<{
  formatId?: string;
  lengthOptionId?: string;
  outputRequirementId?: string;
  scriptTypeId?: string;
  styleId?: string;
  topicId?: string;
}>({
  scriptTypeId: undefined,
  lengthOptionId: undefined,
  topicId: undefined,
  styleId: undefined,
  formatId: undefined,
  outputRequirementId: undefined,
});

// Lấy dữ liệu từ DexieDB
const scriptTypes = useObservable<ScriptType[]>(
  from(liveQuery(() => db.scriptTypes.toArray())),
  { initialValue: undefined },
);
const lengthOptions = useObservable<LengthOption[]>(
  from(liveQuery(() => db.lengthOptions.toArray())),
  { initialValue: undefined },
);
const topics = useObservable<Topic[]>(
  from(liveQuery(() => db.topics.toArray())),
  {
    initialValue: undefined,
  },
);
const styles = useObservable<Style[]>(
  from(liveQuery(() => db.styles.toArray())),
  {
    initialValue: undefined,
  },
);
const formats = useObservable<Format[]>(
  from(liveQuery(() => db.formats.toArray())),
  {
    initialValue: undefined,
  },
);
const outputRequirements = useObservable<OutputRequirement[]>(
  from(liveQuery(() => db.outputRequirements.toArray())),
  { initialValue: undefined },
);
const promptTemplate = useObservable<PromptTemplate | undefined>(
  from(liveQuery(() => db.promptTemplates.get('basic-video-script'))),
);

// API cho phép thêm/xóa Topic
const topicApi = {
  createApi: async (name: string): Promise<Topic> => {
    const newTopic: Topic = {
      id: nanoid(),
      name,
      category: 'custom',
      isCustom: true,
    };
    await db.topics.add(newTopic);
    return newTopic;
  },
  deleteApi: (id: string) => db.topics.delete(id),
};

const finalPrompt = computed(() => {
  if (!promptTemplate.value) return 'Đang tải template...';

  const { structure, placeholders } = promptTemplate.value;

  // Tạo map để tra cứu nhanh hơn thay vì dùng find() nhiều lần
  const optionsMap = {
    scriptTypes: new Map(scriptTypes.value?.map((i) => [i.id, i.name])),
    lengthOptions: new Map(lengthOptions.value?.map((i) => [i.id, i.label])),
    topics: new Map(topics.value?.map((i) => [i.id, i.name])),
    styles: new Map(styles.value?.map((i) => [i.id, i.name])),
    formats: new Map(formats.value?.map((i) => [i.id, i.name])),
    outputRequirements: new Map(
      outputRequirements.value?.map((i) => [i.id, i.name]),
    ),
  };

  const values = {
    scriptType:
      (selections.value.scriptTypeId &&
        optionsMap.scriptTypes.get(selections.value.scriptTypeId)) ||
      '{chưa chọn loại kịch bản}',
    length:
      (selections.value.lengthOptionId &&
        optionsMap.lengthOptions.get(selections.value.lengthOptionId)) ||
      '{chưa chọn độ dài}',
    topic:
      (selections.value.topicId &&
        optionsMap.topics.get(selections.value.topicId)) ||
      '{chưa chọn chủ đề}',
    style:
      (selections.value.styleId &&
        optionsMap.styles.get(selections.value.styleId)) ||
      '{chưa chọn phong cách}',
    format:
      (selections.value.formatId &&
        optionsMap.formats.get(selections.value.formatId)) ||
      '{chưa chọn hình thức}',
    outputRequirement:
      (selections.value.outputRequirementId &&
        optionsMap.outputRequirements.get(
          selections.value.outputRequirementId,
        )) ||
      '{chưa chọn yêu cầu đầu ra}',
  };

  // `placeholders` is an array of strings like ['scriptType', 'length', ...].
  // We need to ensure that `values[placeholder]` is always a string.
  let promptStr = structure || '';
  for (const placeholder of placeholders) {
    const valueToInsert = values[placeholder as keyof typeof values] || '';
    promptStr = promptStr.replace(`{${placeholder}}`, valueToInsert);
  }
  return promptStr;
});

// Tự động cập nhật model cho component cha khi prompt thay đổi
watch(finalPrompt, (newPrompt) => {
  model.value = newPrompt;
});
</script>

<template>
  <Space direction="vertical" style="width: 100%">
    <DynamicSelect
      v-model="selections.scriptTypeId"
      :options="scriptTypes"
      placeholder="Chọn loại kịch bản"
    />
    <DynamicSelect
      v-model="selections.lengthOptionId"
      :options="lengthOptions"
      label-field="label"
      placeholder="Chọn độ dài"
    />
    <DynamicSelect
      v-model="selections.topicId"
      :options="topics"
      :create-api="topicApi.createApi"
      :delete-api="topicApi.deleteApi"
      placeholder="Chọn chủ đề"
    />
    <DynamicSelect
      v-model="selections.styleId"
      :options="styles"
      placeholder="Chọn phong cách"
    />
    <DynamicSelect
      v-model="selections.formatId"
      :options="formats"
      placeholder="Chọn hình thức"
    />
    <DynamicSelect
      v-model="selections.outputRequirementId"
      :options="outputRequirements"
      placeholder="Chọn yêu cầu đầu ra"
    />
  </Space>
</template>

<style scoped>
.ant-space {
  gap: 16px !important;
}
</style>
