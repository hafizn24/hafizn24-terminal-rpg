import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Relative asset URLs so the build works on GitHub Pages subpaths,
  // local previews, and file-adjacent hosts without reconfiguration.
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Terminal RPG — HafizN24',
        short_name: 'Terminal RPG',
        description: 'A terminal-themed browser roguelite. Free forever — no pay-to-win, no timers, no ads.',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'standalone',
        start_url: './',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        // Precache the app shell; Google Fonts stay online-only with
        // monospace fallback when offline.
        globPatterns: ['**/*.{js,css,html,svg}'],
      },
    }),
  ],
})
