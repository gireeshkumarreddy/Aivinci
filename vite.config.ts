import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// `base` defaults to the domain root. For a sub-path deployment (e.g. GitHub Pages at
// /Aivinci/) build with `VITE_BASE=/Aivinci/ npm run build` or `vite build --base=/Aivinci/`.
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  build: {
    // the site is one page; keep the bundle whole so first paint needs a single request
    chunkSizeWarningLimit: 900,
  },
})
