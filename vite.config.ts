import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages 配信時は VITE_BASE=/mimamori-net/ を指定（.github/workflows/deploy.yml 参照）。
// Phase 2 で Firebase Hosting へ移行したら未指定（= '/'）でビルドする。
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'みまもりネット',
        short_name: 'みまもり',
        description:
          '地域の登録メンバーだけで見守り情報を共有するセミクローズドなアプリ',
        lang: 'ja',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        background_color: '#f4f6f6',
        theme_color: '#0f766e',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
})
