import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    env: {
      // テスト専用の固定鍵（32byteをbase64化）。本番運用の鍵とは無関係。
      ENCRYPTION_MASTER_KEY: Buffer.alloc(32, 7).toString('base64'),
    },
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.{test,spec}.{ts,tsx}', 'src/app/**/layout.tsx', 'src/app/**/page.tsx'],
    },
  },
});
