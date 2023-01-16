import path from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueI18n from '@intlify/vite-plugin-vue-i18n'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    target: 'esnext',
    assetsInlineLimit: 0
  },
  optimizeDeps: {
    esbuildOptions: { target: 'esnext' }
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === 'webview'
        }
      }
    }),
    vueI18n({
      runtimeOnly: false // https://github.com/intlify/vue-i18n-next/issues/938
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@ipc': path.resolve(__dirname, './src/../../ipc')
    }
  },
  server: {
    proxy: {
      '^/(config|uploads|proxy)': { target: 'http://127.0.0.1:8584' },
      '/events': { ws: true, target: 'http://127.0.0.1:8584' }
    }
  }
})
