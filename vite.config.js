import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  optimizeDeps: {
    // All runtime deps must be pre-bundled in one pass — otherwise lazily
    // discovered deps (gsap, html2canvas, jspdf) trigger a mid-load
    // re-optimization that can mix React/ReactDOM bundle generations
    // and crash the app with "Invalid hook call".
    include: ['lucide-react', 'canvas-confetti', 'gsap', 'html2canvas', 'jspdf', 'canvg'],
  },
});
