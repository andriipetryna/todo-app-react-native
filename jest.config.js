/** @type {import('jest').Config} */
// The app's unit tests cover pure TypeScript: date/time helpers, notification fire-time
// math, and the SQLite repositories (run against an in-memory better-sqlite3 DB). None
// of these import Expo/React Native native modules, so we use a lean babel-jest + node
// setup rather than the jest-expo preset (which injects Expo's native runtime globals
// and is meant for component tests). React Native Testing Library is installed for
// future component tests, which can run under a separate jsdom project if added.
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.[jt]sx?$': [
      'babel-jest',
      {
        configFile: false,
        babelrc: false,
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          '@babel/preset-typescript',
        ],
      },
    ],
  },
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
};
