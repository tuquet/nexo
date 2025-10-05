<script setup lang="ts" generic="T extends Record<string, any>">
import { h, ref, watchEffect } from 'vue';

import { CarbonDelete } from '@vben/icons';

import { Button, Divider, Input, message, Modal, Select } from 'ant-design-vue';

// --- Props ---
const props = withDefaults(
  defineProps<{
    // API để lấy danh sách các mục
    api?: () => Promise<T[]>;
    // API để tạo một mục mới, nhận vào tên và trả về mục đã tạo
    createApi?: (name: string) => Promise<T>;
    // API để xóa một mục, nhận vào ID
    deleteApi?: (id: string) => Promise<void>;
    // Ánh xạ trường dữ liệu
    labelField?: string;
    // Chế độ chọn nhiều
    multiple?: boolean;
    // Hoặc truyền trực tiếp options
    options?: T[];
    // Văn bản gợi ý
    placeholder?: string;
    valueField?: string;
  }>(),
  {
    api: undefined,
    options: undefined,
    createApi: undefined,
    deleteApi: undefined,
    multiple: false,
    labelField: 'name',
    valueField: 'id',
    placeholder: 'Vui lòng chọn',
  },
);

// --- Model ---
const model = defineModel<string | string[] | undefined>();

// --- State ---
const internalOptions = ref<T[]>([]);
const loading = ref(false);
const newItemName = ref('');

// --- Logic ---

// Tải dữ liệu từ props.api hoặc props.options
watchEffect(async () => {
  // Ưu tiên sử dụng props.options nếu có
  if (props.options) {
    internalOptions.value = props.options;
    return;
  }

  // Nếu không có props.options, sử dụng props.api
  if (props.api) {
    loading.value = true;
    try {
      internalOptions.value = await props.api();
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu cho DynamicSelect:', error);
      message.error('Tải dữ liệu thất bại!');
    } finally {
      loading.value = false;
    }
  }
});

// Lọc các mục khi tìm kiếm
function filterOption(input: string, option: any) {
  const label = option[props.labelField] || '';
  return label.toLowerCase().includes(input.toLowerCase());
}

// Thêm một mục mới
async function handleAddItem() {
  if (!props.createApi) return;
  const name = newItemName.value.trim();
  if (!name) return;

  try {
    const newItem = await props.createApi(name);
    internalOptions.value.push(newItem as any);
    const newId = newItem[props.valueField];
    // Cập nhật model dựa trên chế độ multiple
    if (props.multiple) {
      const currentVal = Array.isArray(model.value) ? model.value : [];
      model.value = [...currentVal, newId];
    } else {
      model.value = newId;
    }
    newItemName.value = ''; // Xóa nội dung input
    message.success(`Đã tạo "${name}" thành công`);
  } catch (error) {
    console.error('Lỗi khi thêm mục:', error);
    message.error('Tạo mới thất bại!');
  }
}

// Xóa một mục
function handleDeleteItem(e: MouseEvent, item: T) {
  e.stopPropagation();
  if (!props.deleteApi) return;

  const id = item[props.valueField];
  const name = item[props.labelField];

  Modal.confirm({
    title: 'Xác nhận xóa',
    content: `Bạn có chắc chắn muốn xóa "${name}" không?`,
    okText: 'Xóa',
    okType: 'danger',
    onOk: async () => {
      try {
        await props.deleteApi!(id);
        internalOptions.value = internalOptions.value.filter(
          (opt) => opt[props.valueField] !== id,
        );
        // Cập nhật model dựa trên chế độ multiple
        if (props.multiple && Array.isArray(model.value)) {
          const index = model.value.indexOf(id);
          if (index !== -1) {
            const newModel = [...model.value];
            newModel.splice(index, 1);
            model.value = newModel;
          }
        } else if (model.value === id) {
          model.value = undefined;
        }
        message.success(`Đã xóa "${name}"`);
      } catch (error) {
        console.error('Lỗi khi xóa mục:', error);
        message.error('Xóa thất bại!');
      }
    },
  });
}
</script>

<template>
  <Select
    v-model:value="model"
    :field-names="{ label: labelField, value: valueField }"
    :mode="multiple ? 'multiple' : undefined"
    :loading="loading"
    :options="internalOptions"
    :placeholder="placeholder"
    :filter-option="filterOption"
    :get-popup-container="(triggerNode) => triggerNode.parentNode"
    allow-clear
    show-search
    style="width: 100%"
  >
    <!-- Tùy chỉnh hiển thị mục để thêm nút xóa -->
    <template v-if="props.deleteApi !== undefined" #option="option">
      <div
        style="
          display: flex;
          align-items: center;
          justify-content: space-between;
        "
      >
        <span>{{ option[labelField] }}</span>
        <Button
          type="text"
          danger
          size="small"
          :icon="h(CarbonDelete)"
          @click="(e) => handleDeleteItem(e, option)"
        />
      </div>
    </template>

    <!-- Thêm khu vực tạo mới -->
    <template
      v-if="props.createApi !== undefined"
      #dropdownRender="{ menuNode }"
    >
      <component :is="menuNode" />
      <Divider style="margin: 8px 0" />
      <div style="display: flex; gap: 8px; padding: 0 8px 8px">
        <Input
          v-model:value="newItemName"
          placeholder="Tên mục mới"
          @keypress.enter="handleAddItem"
        />
        <Button type="primary" @click="handleAddItem"> Thêm </Button>
      </div>
    </template>
  </Select>
</template>
