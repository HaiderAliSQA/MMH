import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  server: { port: 5173 }
})
// NO tailwind in vite config needed — we use pure CSS (mmh.css)
