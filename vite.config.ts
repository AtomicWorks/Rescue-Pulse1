import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    define: {
      // Polyfill process.env for the Google GenAI SDK and codebase compatibility
      // Note: This injects the key at BUILD time.
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  }
})