import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@transport': path.resolve(__dirname, './src/transport'),
      '@capabilities': path.resolve(__dirname, './src/capabilities'),
      '@middleware': path.resolve(__dirname, './src/middleware'),
      '@services': path.resolve(__dirname, './src/services'),
      '@repositories': path.resolve(__dirname, './src/repositories'),
      '@plugins': path.resolve(__dirname, './src/plugins'),
      '@config': path.resolve(__dirname, './src/config'),
      '@logging': path.resolve(__dirname, './src/logging'),
      '@errors': path.resolve(__dirname, './src/errors'),
      '@cache': path.resolve(__dirname, './src/cache'),
      '@monitoring': path.resolve(__dirname, './src/monitoring'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
});
