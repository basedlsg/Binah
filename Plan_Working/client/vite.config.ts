import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  root: '.',
  build: {
    outDir: path.resolve(__dirname, '../www'),
    emptyOutDir: true
  },
  server: {
    port: 5173
  }
})

