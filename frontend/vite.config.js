import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite-конфиг VOLT.
// В деве проксируем /api и /socket.io на бэкенд - чтобы не страдать с CORS.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://localhost:3000',
        changeOrigin: true
      },
      '/socket.io': {
        target: process.env.VITE_API_TARGET || 'http://localhost:3000',
        ws: true,
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000
  }
});
