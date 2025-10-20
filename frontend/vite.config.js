import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const disableHmr = process.env.VITE_DISABLE_HMR === 'true'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    hmr: disableHmr ? false : undefined,
    proxy: {
      '/api/auth': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/api/users': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/api/profiles': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/api/bookings': {
        target: 'http://localhost:3004',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/api/messaging': {
        target: 'http://localhost:3005',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        ws: true // Enable WebSocket proxying
      },
      '/api/reviews': {
        target: 'http://localhost:3006',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/api/notifications': {
        target: 'http://localhost:3007',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/api/analytics': {
        target: 'http://localhost:3008',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/api/calendar': {
        target: 'http://localhost:3011',
        changeOrigin: true,
        rewrite: (path) => {
          // /api/calendar -> /calendar (keep the /calendar)
          // /api/calendar/bookings/... -> /bookings/... (remove /api/calendar)
          if (path.startsWith('/api/calendar/')) {
            return path.replace(/^\/api\/calendar/, '')
          }
          return path.replace(/^\/api/, '')
        }
      }
    }
  }
})
