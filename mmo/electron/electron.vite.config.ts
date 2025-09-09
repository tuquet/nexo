import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'
import dotenv from 'dotenv'

dotenv.config()

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        output: {
          format: 'es'
        }
      }
    },
    resolve: {
      alias: {
        '@resources': resolve('resources/')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        output: {
          format: 'es'
        }
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [vue()]
  }
})
