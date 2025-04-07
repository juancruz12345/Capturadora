import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    },
    // Necesario para Firefox en localhost
    cors: true,
    strictPort: true
  },
  optimizeDeps: {
    include: [
      '@ffmpeg/ffmpeg',
     
    ]
  }
  ,
  plugins: [react()],
})
