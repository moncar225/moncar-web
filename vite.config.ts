/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: false,
    // Pool forks : les workers threads ne démarrent pas de façon fiable
    // dans cet environnement Windows.
    pool: 'forks',
    // Parcours d'interaction complets (clics, saisies, faux backend) :
    // plus lents que le délai par défaut de 5 s sur les postes Windows.
    testTimeout: 20_000,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    css: false,
  },
})
