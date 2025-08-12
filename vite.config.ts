import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',                // Important: Use relative paths
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    outDir: 'dist',          // Output directory for the build
    assetsDir: 'assets',     // Directory for static assets inside dist
    sourcemap: false,        // Disable sourcemaps for faster build
    rollupOptions: {
      output: {
        manualChunks: undefined,  // Disable custom code splitting to avoid path issues
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    }
  }
});