import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: { port: 5173 },
})
// NO tailwind in vite config needed — we use pure CSS (mmh.css)
