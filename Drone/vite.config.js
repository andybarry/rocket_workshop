import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/drone/',
  build: {
    rollupOptions: {
      input: {
        instructions: resolve(__dirname, 'instructions.html')
      }
    }
  },
  server: {
    open: '/instructions.html'
  }
})
