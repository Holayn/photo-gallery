import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    build: {
      sourcemap: true,
    },
    plugins: [vue({
      template: {
        compilerOptions: {
          // Add the tag names of your custom elements here to ignore them
          isCustomElement: (tag) => tag.startsWith('sl-'),
        }
      }
    })],
    base: mode === 'production'
    ? env.VUE_APP_BASE_URL
    : '/',
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    }
  }
});