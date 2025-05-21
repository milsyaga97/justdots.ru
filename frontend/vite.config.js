import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

export default defineConfig({
  server: {
    host: '0.0.0.0', // Разрешает доступ с любых устройств в локальной сети
    port: 5173,      // Порт (можно поменять)
  },

  plugins: [
    react(),
    svgr({
      svgrOptions: {
        // Настройки SVGR (опционально)
      }
    })
  ],
})