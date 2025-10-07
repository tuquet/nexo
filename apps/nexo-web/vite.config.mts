import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      build: {
        rollupOptions: {
          onwarn(warning, warn) {
            // Suppress mixed import warnings for intentional code-splitting in adapter components
            if (
              warning.message?.includes('is dynamically imported by') &&
              warning.message?.includes('ant-design-vue') &&
              warning.message?.includes('adapter/component')
            ) {
              return;
            }
            warn(warning);
          },
        },
      },
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            // mock代理目标地址
            target: 'http://localhost:5320/api',
            ws: true,
          },
        },
      },
    },
  };
});
