import nextPlugin from '@next/eslint-plugin-next';
import rootConfig from '../../eslint.config.mjs';

export default [
  ...rootConfig,
  {
    files: ['**/*.{ts,tsx,js,mjs}'],
    plugins: {
      '@next/next': nextPlugin
    },
    settings: {
      next: {
        rootDir: '.'
      }
    }
  }
];
