import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { localApiPlugin } from './vite-plugin-local-api';

export default defineConfig({
  plugins: [react(), localApiPlugin()],
  server: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '5173'),
  },
});
