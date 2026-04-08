import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '5173'),
    proxy: {
      // Proxy /api calls to the Vercel dev server (port 3000).
      // Run `vercel dev` instead of `npm run dev` for full local dev with API.
      // This also prevents Vite from accidentally serving api/*.ts as source files.
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
