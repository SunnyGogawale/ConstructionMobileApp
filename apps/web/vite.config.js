import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget = env.VITE_API_URL ? new URL(env.VITE_API_URL) : null
  if (apiProxyTarget && mode === 'development') {
    apiProxyTarget.hostname = '127.0.0.1'
  }
  return {
    plugins: [react()],
    define: {
      'process.env.EXPO_PUBLIC_API_URL': JSON.stringify(
        mode === 'development' ? '' : env.VITE_API_URL || '',
      ),
    },
    resolve: {
      alias: [
        {
          find: /^react-native$/,
          replacement: fileURLToPath(new URL('./node_modules/react-native-web/dist/index.js', import.meta.url)),
        },
        {
          find: /^expo-secure-store$/,
          replacement: fileURLToPath(new URL('./src/mobileSecureStore.js', import.meta.url)),
        },
        {
          find: /^@expo\/vector-icons$/,
          replacement: fileURLToPath(new URL('./src/mobileIcons.jsx', import.meta.url)),
        },
        {
          find: /^expo-camera$/,
          replacement: fileURLToPath(new URL('./src/mobileCameraWeb.js', import.meta.url)),
        },
        {
          find: /^expo-image-picker$/,
          replacement: fileURLToPath(new URL('./src/mobileImagePicker.js', import.meta.url)),
        },
        {
          find: /^expo-location$/,
          replacement: fileURLToPath(new URL('./src/mobileLocation.js', import.meta.url)),
        },
        {
          find: /^expo-status-bar$/,
          replacement: fileURLToPath(new URL('./src/mobileStatusBar.jsx', import.meta.url)),
        },
      ],
      dedupe: ['react', 'react-dom'],
      extensions: ['.web.js', '.web.jsx', '.web.ts', '.web.tsx', '.js', '.jsx', '.ts', '.tsx', '.mjs', '.json'],
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      proxy: apiProxyTarget
        ? {
            '/api': {
              target: apiProxyTarget.toString(),
              changeOrigin: true,
              xfwd: true,
            },
          }
        : undefined,
    },
  }
})
