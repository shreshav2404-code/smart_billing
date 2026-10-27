import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // In development, forward API calls to the Express backend so the app can
    // use relative URLs everywhere (same as production, where Express serves dist/).
    proxy: {
      '/api': 'http://localhost:5001',
    },
  },
  build: {
    // recharts is ~530 kB on its own; it only loads with the owner dashboard.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          charts: ['recharts'],
          scanner: ['html5-qrcode'],
        },
      },
    },
  },
})
