import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // ⬅️ Penting! Agar bisa diakses dari device lain
    port: 5173,
    strictPort: true,
  }
})
