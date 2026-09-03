import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { writeFileSync } from 'node:fs'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'tecno-math-pages-cname',
      closeBundle() {
        writeFileSync('dist/CNAME', 'ui.tecnomath.online\n', 'utf8')
      },
    },
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
