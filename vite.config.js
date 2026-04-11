import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: false // La PWA real solo funciona en produccion (npm run build)
      },
      manifest: {
        name: 'Mantenimiento App',
        short_name: 'Mantenimiento',
        description: 'Plataforma administrativa de equipos y mantenimientos',
        theme_color: '#0B1121',
        background_color: '#F8F9FA',
        display: 'standalone', // Obliga al celular a esconder la barra superior de Chrome/Safari
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
