import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@proj/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
})
