import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repoName = 'emergency-response-platform'

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? `/${repoName}/` : '/',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
})
