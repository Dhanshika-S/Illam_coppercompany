import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(projectRoot, 'index.html'),
        products: resolve(projectRoot, 'products.html'),
        login: resolve(projectRoot, 'login.html'),
        account: resolve(projectRoot, 'account.html'),
        cart: resolve(projectRoot, 'cart.html'),
        checkout: resolve(projectRoot, 'checkout.html'),
        confirmation: resolve(projectRoot, 'confirmation.html'),
        invoice: resolve(projectRoot, 'invoice.html'),
      },
    },
  },
})
