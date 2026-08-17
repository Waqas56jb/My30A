import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    // 5173/5174 are the guest app, 5180 the host panel — keep the three apart.
    port: 5185,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
