import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// The full URL of your local emulator function (used for proxying)
const EMULATOR_FUNCTION_URL =
  'http://127.0.0.1:5001/financial-analyzer-c6463/us-central1/genkitProxy';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5500,
    proxy: {
      '/genkit-api': {
        target: EMULATOR_FUNCTION_URL,
        changeOrigin: true,
      },
    },
  },
});
