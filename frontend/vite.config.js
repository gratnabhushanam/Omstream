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
        maximumFileSizeToCacheInBytes: 5242880,
        rollupFormat: 'iife'
      },
      includeAssets: ['logo-om-v2.png', 'screenshot-640x480.png', 'screenshot-1280x800.png'],
      manifest: {
        name: 'Omstream',
        short_name: 'Omstream',
        description: 'Stream spiritual knowledge, devotional music, stories, and timeless wisdom',
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
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'COMMONJS_VARIABLE_IN_ESM') return;
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        warn(warning);
      },
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/react-router-dom')) {
            return 'router-vendor';
          }
          if (id.includes('node_modules/axios')) {
            return 'http-vendor';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'icon-vendor';
          }
          return undefined;
        },
      },
    },
  },
  server: {
    proxy: {
      '/api/movies': { target: 'http://localhost:8889', changeOrigin: true },
      '/api/videos': { target: 'http://localhost:8889', changeOrigin: true },
      '/api/channels': { target: 'http://localhost:8889', changeOrigin: true },
      '/uploads': { target: 'http://localhost:8889', changeOrigin: true },
      
      '/api/songs': { target: 'http://localhost:8890', changeOrigin: true },
      '/api/stories': { target: 'http://localhost:8890', changeOrigin: true },
      '/api/story': { target: 'http://localhost:8890', changeOrigin: true },
      '/api/chapters': { target: 'http://localhost:8890', changeOrigin: true },
      '/api/slokas': { target: 'http://localhost:8890', changeOrigin: true },
      '/api/playlists': { target: 'http://localhost:8890', changeOrigin: true },
      '/api/quiz': { target: 'http://localhost:8890', changeOrigin: true },
      '/api/chat': { target: 'http://localhost:8890', changeOrigin: true },

      '/api': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
    },
  },
})
