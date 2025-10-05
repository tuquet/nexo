import { defineConfig } from '@vben/eslint-config';

export default defineConfig([
  {
    ignores: ['**/*-native/**'],
  },
  {
    files: ['**/*-native/**'],
    rules: {
      '@typescript-eslint/no-extraneous-class': 'off',
      'n/no-extraneous-import': 'off',
      'n/prefer-global/buffer': 'off',
      'n/prefer-global/process': 'off',
      'no-console': 'off',
      'unicorn/prefer-module': 'off',
    },
  },
]);
