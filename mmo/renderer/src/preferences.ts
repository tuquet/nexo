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
    enablePreferences: import.meta.env.DEV,
    defaultAvatar: 'https://cdn-icons-png.flaticon.com/128/3906/3906577.png',
    enableCheckUpdates: false,
  },
  sidebar: {
    collapsed: true,
    collapsedButton: false,
    fixedButton: false,
  },
  logo: {
    enable: false,
    source:
      'https://unpkg.com/@tfsoft/static-source@1.0.0/static/logo-square.png',
    fit: 'cover',
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
    notification: false,
    globalSearch: true,
  },
  footer: {
    enable: true,
  },
  theme: {
    radius: '0.5',
    semiDarkHeader: true,
    mode: 'auto',
    builtinType: 'custom',
    colorDestructive: 'hsl(348 100% 61%)',
    colorPrimary: 'hsl(153 71% 40%)',
    colorSuccess: 'hsla(166, 100%, 38%, 1.00)',
    colorWarning: 'hsl(42 84% 61%)',
  },
  tabbar: {
    enable: true,
    middleClickToClose: true,
  },
});
