import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const authServiceUrl = env.VITE_AUTH_SERVICE_URL || 'http://127.0.0.1:8000'
  const ipServiceUrl = env.VITE_IP_SERVICE_URL || 'http://127.0.0.1:8001'
  const gatewayUrl = env.VITE_GATEWAY_URL || authServiceUrl

  return {
    plugins: [vue()],
    server: {
      port: 3000,
      proxy: {
        // IP management-specific routes
        '/api/ip': {
          target: ipServiceUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/ip/, '/api'),
        },
        // Auth-only routes
        '/api/auth': {
          target: authServiceUrl,
          changeOrigin: true,
        },
        // Gateway or fallback for everything else hitting /api
        '/api': {
          target: gatewayUrl,
          changeOrigin: true,
        },
      },
    },
  }
})
