/**
 * OPT-IN hosted sync-conformance runner (WORK-013). Runs the PRODUCTION
 * push/pull functions (`data/sync/{push,pull}.ts`) against the REAL
 * `createSupabaseGateway` pointed at a real hosted Supabase project — never
 * `FakeGateway`. Needs live network + EXPO_PUBLIC_SUPABASE_URL /
 * EXPO_PUBLIC_SUPABASE_ANON_KEY (client-safe values, not secrets) +
 * HOSTED_TEST_EMAIL_A / _B + HOSTED_TEST_PASSWORD for two CONFIRMED synthetic
 * accounts. NOT part of `npm test` / CI — run explicitly:
 *
 *   EXPO_PUBLIC_SUPABASE_URL=... EXPO_PUBLIC_SUPABASE_ANON_KEY=... \
 *   HOSTED_TEST_EMAIL_A=... HOSTED_TEST_EMAIL_B=... HOSTED_TEST_PASSWORD=... \
 *   npx jest --config jest.hosted.config.cjs
 */
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/hosted/*.hosted.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.hosted-test.json' }],
  },
  testPathIgnorePatterns: ['/node_modules/'],
  clearMocks: true,
  testTimeout: 60_000,
};
