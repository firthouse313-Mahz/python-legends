import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves this as a project site under /python-legends/,
  // not the domain root — every absolute asset path (including the
  // self-hosted Pyodide runtime, see pyodideWorker.ts) has to respect this.
  base: '/python-legends/',
  plugins: [react()],
})
