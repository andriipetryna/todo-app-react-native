// ESLint flat config (ESLint 9). Expo's shared config + Prettier integration.
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = [
  ...expoConfig,
  eslintPluginPrettierRecommended,
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'dist/**',
      'android/**',
      'ios/**',
      'src/db/migrations/**',
      'babel.config.js',
      'metro.config.js',
      'jest.config.js',
      'eslint.config.js',
    ],
  },
  {
    rules: {
      'prettier/prettier': 'warn',
    },
  },
];
