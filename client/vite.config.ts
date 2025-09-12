import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
        // Ensure assets use relative paths
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
  // Ensure proper asset handling
  experimental: {
    renderBuiltUrl(filename: string) {
      return '/' + filename
    }
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: [
      'all',
      '.trycloudflare.com',
      'localhost',
      '127.0.0.1'
    ],
    hmr: {
      protocol: 'ws',
      host: 'localhost'
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})