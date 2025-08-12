import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.NETLIFY ? '/' : './',
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});