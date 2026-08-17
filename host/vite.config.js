import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    // 5173/5174 are commonly taken by the guest app; keep the two apps apart.
    port: 5180,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
