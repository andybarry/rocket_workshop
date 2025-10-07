import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/ai-network/',
  build: {
    rollupOptions: {
      input: {
        '27-network': resolve(__dirname, '27-network.html'),
        '45-network': resolve(__dirname, '45-network.html'),
          'human-neural-network': resolve(__dirname, 'human-neural-network.html'),
          'instructor-slides': resolve(__dirname, 'instructor-slides.html'),
        main: resolve(__dirname, 'index.html')
      }
    }
  },
  server: {
    open: '/27-network.html'
  }
})
