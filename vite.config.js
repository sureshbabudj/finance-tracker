import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5500,
    open: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: id => {
          // Split vendor libraries into separate chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('firebase')) {
              return 'firebase-vendor';
            }
            if (id.includes('pdfjs-dist')) {
              return 'pdf-vendor';
            }
            // All other node_modules go to vendor
            return 'vendor';
          }

          // Split our components
          if (id.includes('/src/components/BankStatementAnalyzer')) {
            return 'analyzer';
          }
          if (id.includes('/src/utils/pdfProcessor')) {
            return 'pdf-utils';
          }
          if (
            id.includes('/src/components/') &&
            (id.includes('LoginScreen') ||
              id.includes('LoadingSpinner') ||
              id.includes('UI'))
          ) {
            return 'ui-components';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1MB
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['pdfjs-dist'],
  },
});
