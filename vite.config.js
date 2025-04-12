import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import wasm from 'vite-plugin-wasm'

// https://vite.dev/config/
export default defineConfig({
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/core'],
  },
  build: {
    assetsInlineLimit: 0, // Para evitar inlining de WASM
  },
  
  
  plugins: [react(),wasm()],
})
