import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In Docker dev, proxy /api to the backend container.
// On Vercel, frontend and API are on the same domain so no proxy is needed.
const apiTarget = process.env.VITE_API_TARGET || 'http://backend:3001';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
});
