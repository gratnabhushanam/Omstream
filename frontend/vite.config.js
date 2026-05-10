import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        rollupOptions: {
          output: {
            format: 'es'
          }
        }
      },
      includeAssets: ['logo-om-v2.png', 'screenshot-640x480.png', 'screenshot-1280x800.png'],
      manifest: {
        name: 'Gita Wisdom Devotion',
        short_name: 'Gita Wisdom',
        description: 'Immersive divine spiritual journey and reels',
        theme_color: '#06101E',
        background_color: '#06101E',
        display: 'standalone',
        orientation: 'any',
        icons: [
          {
            src: 'logo-om-v2.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo-om-v2.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  build: {
    codeSplitting: false,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        codeSplitting: false
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
    },
  },
})
