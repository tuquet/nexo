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
    locale: 'en-US',
    preferencesButtonPosition: 'fixed',
    name: import.meta.env.VITE_APP_TITLE,
    authPageLayout: 'panel-center',
    loginExpiredMode: 'modal',
    defaultHomePath: '/home',
  },
  sidebar: {
    collapsed: true,
  },
  logo: {
    enable: true,
    source:
      'https://unpkg.com/@tfsoft/static-source@1.0.0/static/logo-square.png',
  },
});
