import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/', // Updated base path to match folder name
  // --- เพิ่มส่วนนี้ครับ ---
  server: {
    proxy: {
      '/auth': 'http://localhost:3000',
      '/api': 'http://localhost:3000',
      '/users': 'http://localhost:3000',
      '/logs': 'http://localhost:3000',
      '/form': 'http://localhost:3000',
      '/available-forms': 'http://localhost:3000',
      '/options': 'http://localhost:3000',
      '/search': 'http://localhost:3000'
    }
  }
  // ---------------------
})
