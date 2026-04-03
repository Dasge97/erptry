import tseslint from 'typescript-eslint';

export const baseConfig = tseslint.config({
  files: ['**/*.{ts,tsx}'],
  languageOptions: {
    parser: tseslint.parser
  },
  plugins: {
    '@typescript-eslint': tseslint.plugin
  },
  rules: {
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_'
      }
    ]
  }
});
