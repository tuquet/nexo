import { defineOverridesPreferences } from '@vben/preferences';

/**
 * @description 项目配置文件
 * 只需要覆盖项目中的一部分配置，不需要的配置不用覆盖，会自动使用默认配置
 * !!! 更改配置后请清空缓存，否则可能不生效
 */
export const overridesPreferences = defineOverridesPreferences({
  // overrides
  app: {
    layout: 'header-sidebar-nav',
    locale: 'vi-VN',
    name: import.meta.env.VITE_APP_TITLE,
    authPageLayout: 'panel-center',
    loginExpiredMode: 'modal',
    defaultHomePath: '/workspace',
    enablePreferences: import.meta.env.DEV,
    defaultAvatar: 'https://cdn-icons-png.flaticon.com/128/3906/3906577.png',
    enableCheckUpdates: false,
  },
  breadcrumb: {
    showHome: true,
  },
  sidebar: {
    collapsed: true,
    collapsedButton: true,
    fixedButton: true,
    expandOnHover: true,
  },
  logo: {
    enable: false,
    source: 'https://unpkg.com/@tfsoft/static-source@1.0.4/static/logo.png',
    fit: 'cover',
  },
  copyright: {
    companyName: 'Nexo Studio',
    companySiteLink: 'https://www.facebook.com/quet.jr',
    date: '2025',
    enable: true,
    icp: '',
    icpLink: '',
    settingShow: true,
  },
  widget: {
    fullscreen: true,
    themeToggle: true,
    lockScreen: true,
    notification: true,
    globalSearch: true,
  },
  footer: {
    enable: true,
    fixed: true,
  },
  theme: {
    radius: '0.5',
    semiDarkHeader: true,
    mode: 'auto',
    builtinType: 'default',
    colorPrimary: 'hsl(212 100% 45%)',
  },
  tabbar: {
    enable: true,
    middleClickToClose: true,
    styleType: 'brisk',
  },
  navigation: {
    styleType: 'plain',
  },
});
