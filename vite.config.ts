import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  base: '/WORKHUB/', // GitHub Pages 배포를 위한 절대 경로 설정
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: false,
  }
})