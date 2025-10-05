<script setup lang="ts">
import type { ProjectStatus } from '#/lib/db/base-schema';

import DynamicSelect from '#/components/common/DynamicSelect.vue';

const model = defineModel<ProjectStatus | undefined>();

const STATUS_OPTIONS: { label: string; value: ProjectStatus }[] = [
  { label: 'Kế hoạch', value: 'planning' },
  { label: 'Đang thực hiện', value: 'in-progress' },
  { label: 'Tạm dừng', value: 'on-hold' },
  { label: 'Hoàn thành', value: 'completed' },
];
</script>

<template>
  <DynamicSelect
    v-model="model"
    allow-clear
    :options="STATUS_OPTIONS"
    label-field="label"
    value-field="value"
    placeholder="Chọn trạng thái"
    style="width: 100%"
  />
</template>
