<script setup lang="ts">
import type { Group } from '#/lib/db/project-schema';

import { nanoid } from 'nanoid';

import DynamicSelect from '#/components/common/DynamicSelect.vue';
import { db } from '#/lib/db';

const model = defineModel<string | undefined>();

const groupApi = {
  api: () => db.groups.toArray(),
  createApi: async (name: string): Promise<Group> => {
    const newGroup: Group = { id: nanoid(), name };
    await db.groups.add(newGroup);
    return newGroup;
  },
  deleteApi: (id: string) => db.groups.delete(id),
};
</script>

<template>
  <DynamicSelect v-model="model" v-bind="groupApi" placeholder="Chọn nhóm" />
</template>
