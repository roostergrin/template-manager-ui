import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  esbuild: {
    logOverride: { 
      'this-is-undefined-in-esm': 'silent',
      'empty-import-meta': 'silent',
      'suspicious-boolean-not': 'silent'
    },
    ignoreAnnotations: true,
    legalComments: 'none'
  },
  logLevel: 'silent',
  base: '/', // Ensure proper base path for S3/CloudFront
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Disable source maps in production for security
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          tanstack: ['@tanstack/react-query'],
          rjsf: ['@rjsf/core', '@rjsf/validator-ajv8'],
          dnd: ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities', '@dnd-kit/modifiers']
        }
      }
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler' // Use modern Sass API instead of legacy
      },
      sass: {
        api: 'modern-compiler' // Use modern Sass API instead of legacy
      }
    }
  }
})
