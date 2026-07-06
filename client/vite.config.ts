import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  base: './',
  resolve: {
    alias: {
      // @/ maps to src/ — used throughout the design system components
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-solana': ['@solana/web3.js', '@solana/wallet-adapter-react', '@solana/wallet-adapter-wallets', '@solana/wallet-adapter-base'],
          'vendor-ui': ['lucide-react', 'framer-motion', 'sonner'],
        }
      }
    }
  }
})
