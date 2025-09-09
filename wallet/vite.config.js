// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Ajusta el target si tu backend corre en otro puerto
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,          // permite acceder desde el móvil en la misma red
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8081', // tu PHP dev server
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, '')
      }
    }
  }
})
