import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      manifest: {
        name: '업무통합관리 - WORKHUB',
        short_name: 'WORKHUB',
        description: '업무 관리, 북마크, 필터를 통합한 생산성 앱',
        theme_color: '#3B82F6',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: '/WORKHUB/favicon.ico', sizes: '64x64', type: 'image/x-icon' },
          { src: '/WORKHUB/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/WORKHUB/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        ],
      },
      registerType: 'prompt',
      workbox: {
        globPatterns: [],
        // NavigationRoute 비활성화로 Response 복제 문제 해결
        navigateFallback: undefined,
        runtimeCaching: [
          // 외부 CDN: 캐시
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 31536000,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 31536000,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
  base: '/WORKHUB/', // GitHub Pages 배포를 위한 절대 경로 설정
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: false,
  }
})