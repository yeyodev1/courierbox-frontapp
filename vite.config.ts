import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      // Drivers and counter staff run this on phones and tablets, so the app
      // has to install and survive a flaky connection.
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Courier Box Logistics',
        short_name: 'Courier Box',
        description:
          'Operación Courier Box: counter, bodega, envíos, gestiones de compra y cobranzas.',
        lang: 'es-EC',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#06060A',
        theme_color: '#06060A',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          { name: 'Mis entregas', short_name: 'Entregas', url: '/motorizado' },
          { name: 'Bodega', short_name: 'Bodega', url: '/bodega' },
          { name: 'Rastrear', short_name: 'Rastrear', url: '/rastrear' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}'],
        // SPA fallback, but never shadow the API or the SW itself.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            // Read-only API data: serve from network, fall back to the last
            // good response so a driver in a dead zone still sees their route.
            urlPattern: ({ url, request }) =>
              request.method === 'GET' &&
              /\/api\//.test(url.pathname) &&
              !/\/api\/(auth|payments)\//.test(url.pathname),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'cb-api',
              networkTimeoutSeconds: 6,
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => /cloudinary\.com|res\.cloudinary\.com/.test(url.hostname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'cb-images',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 14 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.hostname === 'cdnjs.cloudflare.com',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'cb-cdn',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'esnext',
  },
  server: {
    port: 5173,
    allowedHosts: [
      'courierboxlogistics.com',
      'testing-storybrand-frontend.bakano.ec',
    ],
  },
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.spec.ts'],
    setupFiles: ['./src/test/setup.ts'],
  },
})
