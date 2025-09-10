import { defineOverridesPreferences } from '@vben/preferences';

/**
 * @description 项目配置文件
 * 只需要覆盖项目中的一部分配置，不需要的配置不用覆盖，会自动使用默认配置
 * !!! 更改配置后请清空缓存，否则可能不生效
 */
export const overridesPreferences = defineOverridesPreferences({
  // overrides
  app: {
    layout: 'header-nav',
    locale: 'vi-VN',
    name: import.meta.env.VITE_APP_TITLE,
    authPageLayout: 'panel-center',
    loginExpiredMode: 'modal',
    defaultHomePath: '/home',
    enablePreferences: true,
    defaultAvatar: 'https://cdn-icons-png.flaticon.com/128/16683/16683419.png',
  },
  sidebar: {
    collapsed: true,
  },
  logo: {
    enable: true,
    source:
      'https://unpkg.com/@tfsoft/static-source@1.0.0/static/logo-square.png',
  },
  copyright: {
    companyName: 'tfsoftware',
    companySiteLink: 'https://tfsoftware.vn',
    date: '2025',
    enable: true,
    icp: '',
    icpLink: '',
    settingShow: true,
  },
  widget: {
    fullscreen: false,
    themeToggle: true,
    lockScreen: false,
  },
  footer: {
    enable: true,
  },
  theme: {
    radius: '0.75',
  },
});
