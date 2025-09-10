import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import autoStartServer from './vite-plugin-auto-start-server.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), autoStartServer()],
  server: {
    port: 5174,
    strictPort: true
  },
  base: '/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        feedback: './index.html',
        'feedback-data': './feedback-data.html'
      }
    }
  }
})
