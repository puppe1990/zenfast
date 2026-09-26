import { defineConfig } from 'vitest/config'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [viteReact()],
  test: {
    env: { NODE_ENV: 'test' },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          env: { NODE_ENV: 'test' },
          include: [
            'src/domain/**/*.test.ts',
            'src/db/**/*.test.ts',
            'src/server/**/*.test.ts',
            'src/pwa/**/*.test.ts',
            'src/lib/**/*.test.ts',
          ],
        },
      },
      {
        extends: true,
        test: {
          name: 'ui',
          environment: 'jsdom',
          env: { NODE_ENV: 'test' },
          setupFiles: ['./src/test/setup.ts'],
          include: ['src/components/**/*.test.tsx', 'src/routes/**/*.test.tsx'],
        },
      },
    ],
    coverage: {
      provider: 'v8',
      include: ['src/domain/**', 'src/db/**'],
      reporter: ['text', 'lcov'],
    },
  },
})
