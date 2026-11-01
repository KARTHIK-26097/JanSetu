import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      input: {
        home: resolve(projectRoot, 'index.html'),
        citizen: resolve(projectRoot, 'citizen.html'),
        handler: resolve(projectRoot, 'handler.html'),
      },
    },
  },
})
