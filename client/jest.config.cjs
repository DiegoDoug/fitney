/**
 * Logic-layer test runner (phase 5, first pass).
 *
 * This config runs the PURE / IO-seam tests — domain, services, data/local
 * (against a better-sqlite3 driver adapter), data/sync, and the WORK-020
 * recompute golden-vector cross-run — in plain Node, with no React Native or
 * Expo runtime. Component/screen and device tests use `jest-expo` and run in
 * CI where the full native toolchain is installed (see jest-expo.config.cjs,
 * added with the screen slice).
 */
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.logic.json' }],
  },
  // Exclude tests that require the RN/Expo runtime from this project.
  testPathIgnorePatterns: [
    '/node_modules/',
    '\\.native\\.test\\.ts$',
    '/src/data/remote/__tests__/gateway\\.',
    // opt-in hosted-only suites (jest.hosted.config.cjs) import data/remote/gateway.ts
    // + data/remote/auth-gateway.ts, which tsconfig.logic.json deliberately excludes —
    // never run these under the logic-tsconfig CI project (they'd fail to compile here
    // even though they'd runtime-skip; run them via jest.hosted.config.cjs instead).
    '/__tests__/hosted/',
  ],
  clearMocks: true,
};
