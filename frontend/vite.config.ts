import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err: any) => {
            if (err.code === 'ECONNRESET' || err.code === 'ECONNABORTED' || err.code === 'ECANCELED') return;
          });
          proxy.on('proxyReqWs', (_proxyReq, _req, socket) => {
            socket.on('error', (err: any) => {
              if (err.code === 'ECONNRESET' || err.code === 'ECONNABORTED' || err.code === 'ECANCELED') return;
            });
          });
        }
      },
      '/hubs': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
