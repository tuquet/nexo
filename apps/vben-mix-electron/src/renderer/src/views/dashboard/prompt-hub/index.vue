<script setup lang="ts">
import type { PromptHub } from '#/lib/db/prompt-schema';

import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { CarbonAdd } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button, ButtonGroup, message, Modal, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { db } from '#/lib/db';

interface PromptHubWithTags extends PromptHub {
  tags: string[];
}

const router = useRouter();

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    autoResize: true,
    border: true,
    align: 'left',
    size: 'small',
    keepSource: true,
    rowConfig: {
      keyField: 'id',
    },
    columns: [
      {
        field: 'title',
        title: 'Tiêu đề',
        minWidth: 200,
      },
      {
        field: 'description',
        title: 'Mô tả',
        minWidth: 250,
      },
      {
        field: 'prompt',
        title: 'Nội dung Prompt',
        showOverflow: 'tooltip',
      },
      {
        field: 'tags',
        title: 'Tags',
        slots: { default: 'tags' },
      },
      {
        field: 'date',
        title: 'Ngày tạo',
        width: 150,
        formatter: ({ cellValue }: any) =>
          new Date(cellValue).toLocaleDateString(),
      },
      {
        title: 'Hành động',
        width: 120,
        fixed: 'right',
        align: 'center',
        slots: { default: 'action' },
      },
    ],
    data: [],
    height: 'auto',
    pagerConfig: { enabled: false },
  },
});

async function loadPromptHubs() {
  try {
    // 1. Lấy dữ liệu từ các bảng liên quan
    const [prompts, allTags, allPromptTags] = await Promise.all([
      db.promptHubs.orderBy('date').reverse().toArray(),
      db.tags.toArray(),
      db.promptTags.toArray(),
    ]);

    // 2. Tạo các map để tra cứu hiệu quả
    const tagsMap = new Map(allTags.map((tag) => [tag.id, tag.name]));
    const promptIdToTagIdsMap = new Map<number, number[]>();
    for (const link of allPromptTags) {
      if (!promptIdToTagIdsMap.has(link.promptId)) {
        promptIdToTagIdsMap.set(link.promptId, []);
      }
      promptIdToTagIdsMap.get(link.promptId)!.push(link.tagId);
    }

    // 3. Gắn dữ liệu tag vào mỗi prompt
    const promptsWithTags = prompts.map((prompt) => {
      const tagIds = prompt.id ? promptIdToTagIdsMap.get(prompt.id) : [];
      const tags = tagIds
        ? tagIds.map((tagId) => tagsMap.get(tagId)!).filter(Boolean)
        : [];
      return { ...prompt, tags };
    });
    const { grid } = gridApi;
    if (grid) {
      grid.loadData(promptsWithTags);
    }
  } catch (error) {
    console.error('Failed to load prompt hubs:', error);
    message.error('Tải danh sách prompt thất bại!');
  }
}

function handleCreate() {
  router.push({ name: 'PromptHubCreate' });
}

function handleEdit(prompt: PromptHubWithTags) {
  if (prompt.id === undefined) {
    return;
  }
  router.push({ name: 'PromptHubEdit', params: { id: prompt.id } });
}

function handleDelete(prompt: PromptHubWithTags) {
  Modal.confirm({
    title: $t('page.common.confirmDelete.title'),
    content: $t('page.common.confirmDelete.content', {
      0: `"${prompt.title}"`,
    }),
    okText: $t('page.common.confirmDelete.okText'),
    onOk: async () => {
      if (prompt.id === undefined) {
        return;
      }
      await db.promptHubs.delete(prompt.id);
      gridApi.grid?.remove(prompt);
      message.success('Xóa prompt thành công!');
    },
  });
}

onMounted(() => {
  loadPromptHubs();
});
</script>

<template>
  <Page title="Danh sách Prompt" auto-content-height>
    <template #extra>
      <Button type="primary" @click="handleCreate">
        <CarbonAdd /> Tạo Prompt
      </Button>
    </template>
    <Grid>
      <template #tags="slotProps">
        <span
          v-if="
            (slotProps.row as PromptHubWithTags).tags &&
            (slotProps.row as PromptHubWithTags).tags.length > 0
          "
        >
          <Tag
            v-for="tag in (slotProps.row as PromptHubWithTags).tags"
            :key="tag"
            color="blue"
            >{{ tag }}
          </Tag>
        </span>
      </template>
      <template #action="slotProps">
        <ButtonGroup>
          <Button
            size="small"
            @click="handleEdit(slotProps.row as PromptHubWithTags)"
          >
            Sửa
          </Button>
          <Button
            size="small"
            danger
            @click="handleDelete(slotProps.row as PromptHubWithTags)"
          >
            Xóa
          </Button>
        </ButtonGroup>
      </template>
    </Grid>
  </Page>
</template>

<style scoped></style>
