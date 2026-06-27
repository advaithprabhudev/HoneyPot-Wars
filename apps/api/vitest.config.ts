import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
  resolve: {
    alias: {
      '@honeypot-wars/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
})
