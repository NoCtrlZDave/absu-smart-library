import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    files: ['**/*.js'],
    ignores: ['node_modules/**', 'dist/**'],
    ...js.configs.recommended,
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.commonjs,
      },
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
];