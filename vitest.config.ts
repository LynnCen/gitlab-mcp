import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests-v2/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'src'],
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests-v2/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src-v2'),
      '@core': path.resolve(__dirname, './src-v2/core'),
      '@transport': path.resolve(__dirname, './src-v2/transport'),
      '@capabilities': path.resolve(__dirname, './src-v2/capabilities'),
      '@middleware': path.resolve(__dirname, './src-v2/middleware'),
      '@services': path.resolve(__dirname, './src-v2/services'),
      '@repositories': path.resolve(__dirname, './src-v2/repositories'),
      '@plugins': path.resolve(__dirname, './src-v2/plugins'),
      '@config': path.resolve(__dirname, './src-v2/config'),
      '@logging': path.resolve(__dirname, './src-v2/logging'),
      '@errors': path.resolve(__dirname, './src-v2/errors'),
      '@cache': path.resolve(__dirname, './src-v2/cache'),
      '@monitoring': path.resolve(__dirname, './src-v2/monitoring'),
      '@types': path.resolve(__dirname, './src-v2/types'),
      '@utils': path.resolve(__dirname, './src-v2/utils'),
    },
  },
});

