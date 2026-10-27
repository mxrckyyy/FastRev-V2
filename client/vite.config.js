import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Minimal Vite configuration. Detailed setup is completed in Phase 1.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});