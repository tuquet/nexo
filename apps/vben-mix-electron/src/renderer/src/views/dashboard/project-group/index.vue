<script setup lang="ts">
import type { Group } from '#/lib/db/project-schema';

import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { CarbonAdd } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button, ButtonGroup, message, Modal, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { db } from '#/lib/db';

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
      { field: 'name', title: 'Tên nhóm', minWidth: 250 },
      {
        field: 'color',
        title: 'Màu sắc',
        width: 150,
        slots: { default: 'color' },
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

async function loadGroups() {
  try {
    const groups = await db.groups.toArray();
    const { grid } = gridApi;
    if (grid) {
      grid.loadData(groups);
    }
  } catch (error) {
    console.error('Failed to load groups:', error);
    message.error('Tải danh sách nhóm thất bại!');
  }
}

function handleCreate() {
  router.push({ name: 'ProjectGroupCreate' });
}

function handleEdit(group: Group) {
  // Chuyển hướng đến trang chỉnh sửa, bạn cần tạo route và component `ProjectGroupEdit`
  // router.push({ name: 'ProjectGroupEdit', params: { id: group.id } });
  message.info(`Chức năng sửa nhóm "${group.name}" đang được phát triển.`);
}

function handleDelete(group: Group) {
  Modal.confirm({
    title: $t('page.common.confirmDelete.title'),
    content: $t('page.common.confirmDelete.content', {
      0: `"${group.name}"`,
    }),
    okText: $t('page.common.confirmDelete.okText'),
    onOk: async () => {
      await db.groups.delete(group.id);
      gridApi.grid?.remove(group);
      message.success('Xóa nhóm thành công!');
    },
  });
}

onMounted(() => {
  loadGroups();
});
</script>

<template>
  <Page :title="$t('page.project.group.list')" auto-content-height>
    <template #extra>
      <Button type="primary" @click="handleCreate">
        <CarbonAdd /> {{ $t('page.project.group.create') }}
      </Button>
    </template>
    <Grid>
      <template #color="{ row }: { row: Group }">
        <Tag v-if="row.color" :color="row.color">{{ row.color }}</Tag>
      </template>
      <template #action="{ row }">
        <ButtonGroup>
          <Button size="small" @click="handleEdit(row)"> Sửa </Button>
          <Button size="small" danger @click="handleDelete(row)"> Xóa </Button>
        </ButtonGroup>
      </template>
    </Grid>
  </Page>
</template>
