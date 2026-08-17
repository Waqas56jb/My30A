import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    // 5173 guest, 5180 host, 5185 partner — keep the four apps apart.
    port: 5190,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
