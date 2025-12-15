import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: '업무통합관리 - WORKHUB',
        short_name: 'WORKHUB',
        description: '업무 관리, 북마크, 필터를 통합한 생산성 앱',
        theme_color: '#3B82F6',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/WORKHUB/',
        start_url: '/WORKHUB/',
        icons: [
          { src: '/WORKHUB/icons/icon-72x72.png', sizes: '72x72', type: 'image/png' },
          { src: '/WORKHUB/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
          { src: '/WORKHUB/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
          { src: '/WORKHUB/icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
          { src: '/WORKHUB/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
          { src: '/WORKHUB/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/WORKHUB/icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
          { src: '/WORKHUB/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          // Firebase API - NetworkFirst 전략
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firebase-api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 300, // 5분
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Firebase Auth - NetworkFirst
          {
            urlPattern: /^https:\/\/identitytoolkit\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firebase-auth-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 3600, // 1시간
              },
            },
          },
          // Google Fonts CSS - StaleWhileRevalidate
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
          // Google Fonts WebFonts - CacheFirst
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 31536000, // 1년
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
      devOptions: {
        enabled: false, // 개발 중에는 비활성화
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