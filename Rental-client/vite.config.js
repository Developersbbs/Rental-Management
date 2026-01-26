import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  // Add this server configuration
  server: {
    proxy: {
      // Forward any request starting with /api to your backend
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:5000', // Your backend server address
        changeOrigin: true,
      },
    },
  },
})