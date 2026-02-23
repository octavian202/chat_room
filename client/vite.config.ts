import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  server: {
    proxy: {
      '/ws': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:8081',
        ws: true,
      },
      '/chat': process.env.VITE_API_BASE_URL || 'http://localhost:8081',
    },
  },
})
