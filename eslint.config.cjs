const tsEslint = require('@typescript-eslint/eslint-plugin');

module.exports = [
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**', 'eslint.config.cjs', 'jest.config.cjs']
  },
  {
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      globals: {
        process: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        describe: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        jest: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tsEslint
    },
    rules: {
      ...tsEslint.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off'
    }
  }
];
