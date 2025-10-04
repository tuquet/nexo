<script setup lang="ts">
import type { Project, ProjectStatus } from '#/lib/db/project-schema';

import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { CarbonAdd } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button, ButtonGroup, message, Modal, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import GroupSelectEditor from '#/components/business/GroupSelectEditor.vue';
import StatusSelectEditor from '#/components/business/StatusSelectEditor.vue';
import { db } from '#/lib/db';
import { attachGroupLabelToProjects } from '#/utils';

const router = useRouter();

const STATUS_OPTIONS: { label: string; value: ProjectStatus }[] = [
  { label: 'Kế hoạch', value: 'planning' },
  { label: 'Đang thực hiện', value: 'in-progress' },
  { label: 'Tạm dừng', value: 'on-hold' },
  { label: 'Hoàn thành', value: 'completed' },
];

function getStatusText(status: ProjectStatus) {
  return STATUS_OPTIONS.find((opt) => opt.value === status)?.label || status;
}

function getStatusColor(status: ProjectStatus) {
  switch (status) {
    case 'completed': {
      return 'success';
    }
    case 'in-progress': {
      return 'processing';
    }
    case 'on-hold': {
      return 'warning';
    }
    default: {
      return 'default';
    }
  }
}

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
        minWidth: 250,
        treeNode: true,
      },
      {
        field: 'groupId',
        title: 'Nhóm',
        minWidth: 150,
        editRender: {
          // Bật chế độ render để slot 'edit' hoạt động
        },
        slots: { default: 'group', edit: 'group_edit' },
      },
      {
        field: 'status',
        title: 'Trạng thái',
        width: 150,
        editRender: {},
        slots: {
          default: 'status',
          edit: 'status_edit',
        },
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
    editConfig: {
      trigger: 'click',
      mode: 'cell',
      showStatus: true,
      showUpdateStatus: true,
    },
    data: [],
    height: 'auto',
    pagerConfig: { enabled: false },
  },
  gridEvents: {
    editClosed: onEditClosed,
  },
});

async function loadProjects() {
  try {
    const [projects, groups] = await Promise.all([
      db.projects.orderBy('date').reverse().toArray(),
      db.groups.toArray(),
    ]);
    const projectsWithGroup = attachGroupLabelToProjects(projects, groups);
    const { grid } = gridApi;
    if (grid) {
      grid.loadData(projectsWithGroup);
    }
  } catch (error) {
    console.error('Failed to load projects:', error);
  }
}

function handleCreate() {
  router.push({ name: 'ProjectCreate' });
}

function handleEdit(project: Project) {
  if (project.id === undefined) {
    return;
  }
  router.push({ name: 'ProjectEdit', params: { id: project.id } });
}

function handleDelete(project: Project) {
  Modal.confirm({
    title: $t('page.common.confirmDelete.title'),
    content: $t('page.common.confirmDelete.content', {
      0: `"${project.title}"`,
    }),
    okText: $t('page.common.confirmDelete.okText'),
    onOk: async () => {
      if (project.id === undefined) {
        return;
      }
      await db.projects.delete(project.id);
      gridApi.grid?.remove(project);
    },
  });
}

async function updateProjectField(
  id: number,
  field: keyof Project,
  value: any,
) {
  try {
    await db.projects.update(id, { [field]: value });
    message.success(`Cập nhật thành công!`);
  } catch (error) {
    console.error(`Failed to update project field ${field}:`, error);
    message.error(`Cập nhật thất bại!`);
  }
}

async function onEditClosed({ row, column }: any) {
  // Kiểm tra xem row này có thay đổi so với dữ liệu gốc không
  const { grid } = gridApi;
  if (grid?.isUpdateByRow(row)) {
    if (row.id === undefined) {
      return;
    }
    await updateProjectField(row.id, column.property, row[column.property]);

    // Nếu cột được chỉnh sửa là 'groupId', chúng ta cần cập nhật lại tên nhóm ('group')
    // để giao diện hiển thị đúng ngay lập tức.
    if (column.property === 'groupId') {
      const newGroupId = row.groupId;
      if (newGroupId) {
        const group = await db.groups.get(newGroupId);
        row.group = group?.name || ''; // Cập nhật tên nhóm
      } else {
        row.group = ''; // Xóa tên nhóm nếu không có nhóm nào được chọn
      }
    }

    grid.reloadRow(row, undefined, column.property);
  }
}

onMounted(() => {
  loadProjects();
});
</script>

<template>
  <Page :title="$t('page.project.title')" auto-content-height>
    <template #extra>
      <Button type="primary" @click="handleCreate">
        <CarbonAdd /> Tạo dự án
      </Button>
    </template>
    <Grid>
      <template #status="{ row }: { row: Project }">
        <Tag :color="getStatusColor(row.status as ProjectStatus)">
          {{ getStatusText(row.status as ProjectStatus) }}
        </Tag>
      </template>
      <template #group="{ row }: { row: Project & { group?: string } }">
        <Tag v-if="row.group">{{ row.group }}</Tag>
      </template>

      <!-- Slot cho chế độ chỉnh sửa cột Nhóm -->
      <template #group_edit="{ row }: { row: Project }">
        <GroupSelectEditor v-model="row.groupId" />
      </template>
      <template #status_edit="{ row }: { row: Project }">
        <StatusSelectEditor v-model="row.status" />
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
