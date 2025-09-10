/**
 * @zh_CN 登录页面 url 地址
 */
export const LOGIN_PATH = '/auth/login';

export interface LanguageOption {
  label: string;
  value: 'en-US' | 'vi-VN' | 'zh-CN';
}

/**
 * Supported languages
 */
export const SUPPORT_LANGUAGES: LanguageOption[] = [
  {
    label: 'Tiếng Việt',
    value: 'vi-VN',
  },
  {
    label: 'English',
    value: 'en-US',
  },
  // {
  //   label: '简体中文',
  //   value: 'zh-CN',
  // },
];
