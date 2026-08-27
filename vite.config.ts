import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('framer-motion')) return 'framer'
            if (
              id.includes('highlight.js') ||
              id.includes('rehype-highlight') ||
              id.includes('rehype-raw') ||
              id.includes('remark-gfm') ||
              id.includes('react-markdown')
            )
              return 'markdown'
            if (id.includes('lucide-react')) return 'icons'
          }
        },
      },
    },
  },
})
