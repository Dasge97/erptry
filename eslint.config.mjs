import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { baseConfig } from './packages/config/eslint/base.mjs';

export default tseslint.config(
  js.configs.recommended,
  ...baseConfig,
  {
    files: ['**/*.{ts,tsx,js,mjs}'],
    ignores: ['**/dist/**', '**/.next/**', '**/node_modules/**'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser
      }
    }
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    plugins: {
      '@next/next': nextPlugin
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules
    }
  }
);
