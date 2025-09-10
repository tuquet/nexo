<script lang="ts" setup>
import { Page } from '@vben/common-ui';

import { Card, message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';

const [Form] = useVbenForm({
  handleSubmit,
  layout: 'vertical',
  // Bố cục 2 cột trên màn hình vừa và lớn
  wrapperClass: 'grid-cols-1 md:grid-cols-3 gap-x-5',
  schema: [
    {
      component: 'Select',
      fieldName: 'apiProvider',
      label: 'Nhà cung cấp AI',
      componentProps: {
        class: 'w-full',
        options: [
          { label: 'Google Gemini', value: 'gemini' },
          { label: 'OpenAI ChatGPT', value: 'chatGPT' },
        ],
      },
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'topic',
      label: 'Chủ đề Video / Ý tưởng chính',
      componentProps: {
        placeholder:
          "VD: 'Một bộ phim ngắn về một con robot lần đầu tiên khám phá ra âm nhạc.'",
        rows: 4,
      },
      rules: 'required',
    },
    {
      component: 'Select',
      fieldName: 'scriptType',
      label: 'Loại kịch bản',
      componentProps: {
        class: 'w-full',
        options: [
          { label: 'Phim ngắn', value: 'shortFilm' },
          { label: 'Vlog', value: 'vlogOutline' },
          { label: 'Podcast', value: 'podcastScript' },
          { label: 'Trạng thái', value: 'status' },
        ],
      },
      rules: 'required',
    },
    {
      component: 'Select',
      fieldName: 'language',
      label: 'Ngôn ngữ',
      componentProps: {
        class: 'w-full',
        options: [
          { label: 'Tiếng Việt', value: 'vietnamese' },
          { label: 'Tiếng Anh', value: 'english' },
        ],
      },
      rules: 'required',
    },
    {
      component: 'Select',
      fieldName: 'genres',
      label: 'Thể loại',
      componentProps: {
        class: 'w-full',
        mode: 'tags',
        placeholder: 'Chọn hoặc nhập thể loại',
      },
    },
    {
      component: 'InputNumber',
      fieldName: 'characterCount',
      label: 'Độ dài dự kiến (Ký tự)',
      componentProps: {
        class: 'w-full',
        min: 10,
        max: 5000,
      },
    },
    {
      component: 'Input',
      fieldName: 'mainCharacter',
      label: 'Tên nhân vật chính',
      componentProps: {
        placeholder: "VD: 'Alex'",
      },
    },
    {
      component: 'Input',
      fieldName: 'setting',
      label: 'Bối cảnh',
      componentProps: {
        placeholder:
          "VD: 'Một con hẻm nhỏ, ẩm ướt trong một thành phố tương lai'",
      },
    },
    {
      component: 'Input',
      fieldName: 'targetAudience',
      label: 'Đối tượng mục tiêu',
      componentProps: {
        placeholder: "VD: 'Lập trình viên mới bắt đầu'",
      },
    },
    {
      component: 'Input',
      fieldName: 'callToAction',
      label: 'Kêu gọi hành động',
      componentProps: {
        placeholder: "VD: 'Hãy nhấn Like và Đăng ký kênh!'",
      },
    },
    {
      component: 'Switch',
      fieldName: 'advancedSwitch',
      label: 'Tùy chọn nâng cao',
    },
    {
      component: 'InputNumber',
      fieldName: 'temperature',
      label: 'Mức độ sáng tạo',
      componentProps: {
        min: 0,
        max: 1,
        step: 0.1,
      },
      dependencies: {
        if: (values) => values.advancedSwitch,
        triggerFields: ['advancedSwitch'],
      },
      help: 'Giá trị cao hơn sẽ tạo ra kết quả ngẫu nhiên và sáng tạo hơn.',
    },
  ],
});

function handleSubmit(values: Record<string, any>) {
  message.loading({
    content: 'AI đang suy nghĩ... Vui lòng chờ.',
    duration: 0, // indefinite
  });

  // Mô phỏng việc gọi API đến AI
  setTimeout(() => {
    message.destroy(); // Đóng thông báo loading
    message.success({
      content: `Yêu cầu đã được gửi cho chủ đề: "${values.topic}". Vui lòng kiểm tra console để biết chi tiết.`,
    });
    // Tại đây, bạn sẽ xử lý và hiển thị kết quả trả về từ AI.
  }, 2000);
}
</script>

<template>
  <Page
    description="Không bao giờ cạn ý tưởng. Mô tả chủ đề của bạn và để AI tạo ra một kịch bản video chi tiết, từ mở đầu đến kết thúc."
    title="Viết kịch bản bằng AI"
  >
    <Card title="Nhập thông tin để tạo kịch bản">
      <Form />
    </Card>
  </Page>
</template>
