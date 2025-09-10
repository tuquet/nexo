export type Locale = 'en-US' | 'vi-VN' | 'zh-CN';

export const messages: Record<Locale, Record<string, string>> = {
  'en-US': {
    cancel: 'Cancel',
    collapse: 'Collapse',
    confirm: 'Confirm',
    expand: 'Expand',
    prompt: 'Prompt',
    reset: 'Reset',
    submit: 'Submit',
  },
  'zh-CN': {
    cancel: '取消',
    collapse: '收起',
    confirm: '确认',
    expand: '展开',
    prompt: '提示',
    reset: '重置',
    submit: '提交',
  },
  'vi-VN': {
    cancel: 'Hủy bỏ',
    collapse: 'Thu gọn',
    confirm: 'Xác nhận',
    expand: 'Mở rộng',
    prompt: 'Nhắc nhở',
    reset: 'Cài lại',
    submit: 'Gửi',
  },
};

export const getMessages = (locale: Locale) => messages[locale];
