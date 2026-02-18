import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
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
    base: '/',
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