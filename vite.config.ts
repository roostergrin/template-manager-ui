import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
