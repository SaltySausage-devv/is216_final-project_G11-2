import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const disableHmr = process.env.VITE_DISABLE_HMR === 'true'

// Helper to configure auth header forwarding for all proxies
const proxyWithAuth = (target) => ({
  target,
  changeOrigin: true,
  rewrite: (path) => path.replace(/^\/api/, ''),
  configure: (proxy) => {
    proxy.on('proxyReq', (proxyReq, req) => {
      if (req.headers.authorization) {
        proxyReq.setHeader('Authorization', req.headers.authorization);
      }
    });
  }
})

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    hmr: disableHmr ? false : undefined,
    proxy: {
      '/api/auth': proxyWithAuth('http://localhost:3001'),
      '/api/users': proxyWithAuth('http://localhost:3002'),
      '/api/profiles': proxyWithAuth('http://localhost:3003'),
      '/api/bookings': proxyWithAuth('http://localhost:3004'),
      '/api/messaging': {
        ...proxyWithAuth('http://localhost:3005'),
        ws: true // Enable WebSocket proxying
      },
      '/api/reviews': proxyWithAuth('http://localhost:3006'),
      '/api/notifications': proxyWithAuth('http://localhost:3007'),
      '/api/analytics': proxyWithAuth('http://localhost:3008'),
      '/api/calendar': {
        ...proxyWithAuth('http://localhost:3011'),
        rewrite: (path) => {
          // /api/calendar -> /calendar (keep the /calendar)
          // /api/calendar/bookings/... -> /bookings/... (remove /api/calendar)
          if (path.startsWith('/api/calendar/')) {
            return path.replace(/^\/api\/calendar/, '')
          }
          return path.replace(/^\/api/, '')
        }
      },
      '/api/maps': proxyWithAuth('http://localhost:3012')
    }
  }
})
