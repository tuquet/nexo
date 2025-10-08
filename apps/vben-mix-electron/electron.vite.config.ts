import { resolve } from 'node:path';

import vue from '@vitejs/plugin-vue';
import dotenv from 'dotenv';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';

dotenv.config();

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        output: {
          format: 'es',
        },
      },
    },
    resolve: {
      alias: {
        '@resources': resolve('resources/'),
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        output: {
          format: 'es',
        },
      },
    },
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '#': resolve('src/renderer/src'),
      },
    },
    plugins: [vue()],
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: ``,
        },
      },
    },
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
          target: 'http://localhost:5320/api',
          ws: true,
        },
      },
    },
    optimizeDeps: {
      include: [
        'vue',
        'vue-router',
        'pinia',
        '@vueuse/core',
        'ant-design-vue',
        '@supabase/supabase-js',
        'dayjs',
        'nanoid',
        'dexie',
      ],
    },
  },
});
