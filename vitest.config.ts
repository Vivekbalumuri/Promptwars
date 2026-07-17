import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: 'src/setupTests.js',
    include: ['src/**/__tests__/**', 'tests/**'],
    exclude: ['node_modules/**', 'tests/e2e/**'],
    coverage: { reporter: ['text', 'lcov'], provider: 'v8' }
  }
});
