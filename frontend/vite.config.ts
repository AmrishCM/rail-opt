import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    strictPort: true,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8100',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://127.0.0.1:8100',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5180,
    strictPort: true,
  },
})