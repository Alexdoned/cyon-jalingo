import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'// or @vitejs/plugin-react

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Points to your new backend port
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
