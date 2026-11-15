/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 'prompt': a nova versão fica à espera até o utilizador carregar em "Atualizar"
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Contador de Teletrabalho',
        short_name: 'Teletrabalho',
        description: 'Registo e planeamento semestral de dias de teletrabalho',
        lang: 'pt-PT',
        start_url: '/',
        scope: '/',
        id: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f8fafc',
        theme_color: '#4f46e5',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        // Sem skipWaiting/clientsClaim automáticos: a atualização só é aplicada a pedido
        clientsClaim: false,
        skipWaiting: false,
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    alias: {
      'virtual:pwa-register/react': fileURLToPath(new URL('./src/test/pwa-register-stub.ts', import.meta.url)),
    },
  },
})
