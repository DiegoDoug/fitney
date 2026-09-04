/**
 * Layered dependency rule — ADR-0002 / AR-DEC-02, system-architecture.md §6.1.
 *
 * Enforced import matrix (forbidden edges below):
 *
 *   app/            -> features/*, components/, design-system/            (NOT data/*, domain/*, services impls, supabase)
 *   components/,
 *   design-system/  -> design-system/, react, react-native               (NOT features/, data/, domain/, supabase)
 *   features/*      -> domain/*, services/* (interfaces), data/repositories, components/
 *                                                                        (NOT data/local, data/sync, data/remote, supabase)
 *   domain/*        -> other domain/*, pure utils                        (NO I/O: no data/*, no services impls, no RN, no supabase, no Date.now/Math.random)
 *   services/*      -> platform SDKs behind its own interface            (NOT features/*, domain/* policies)
 *   data/repositories -> domain/* types, services/* interfaces           (NOT data/remote directly)
 *   data/local     -> data/repositories, expo-sqlite, domain/* types     (NOT data/remote, supabase, features/*)
 *   data/sync      -> data/repositories, data/local, data/remote         (NOT features/*, app/)
 *   data/remote    -> supabase-js, generated types, zod schemas          (NOT domain/* policies, features/*, data/local)
 *
 * `npm run lint:boundaries` runs this; the client-verify CI workflow fails the
 * build on any violation (AR-RISK-6 / AR-C4).
 */
'use strict';

module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular dependencies make the layer graph unsound.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'domain-is-pure',
      severity: 'error',
      comment:
        'domain/* must be pure: no data/*, no services impls, no react-native, no supabase, no Expo.',
      from: { path: '^src/domain/' },
      to: {
        path: '^(src/data/|src/features/|src/app/|node_modules/(react-native|expo|@supabase|expo-sqlite|expo-secure-store))',
      },
    },
    {
      name: 'domain-no-services-impl',
      severity: 'error',
      comment: 'domain/* may not import a concrete service implementation (only via injected interface args).',
      from: { path: '^src/domain/' },
      to: { path: '^src/services/impl/' },
    },
    {
      name: 'features-no-infra',
      severity: 'error',
      comment:
        'features/* must not touch data/local, data/sync, data/remote, or supabase directly — go through data/repositories interfaces.',
      from: { path: '^src/features/' },
      to: {
        path: '^(src/data/local/|src/data/sync/|src/data/remote/|node_modules/@supabase)',
      },
    },
    {
      name: 'features-no-app',
      severity: 'error',
      from: { path: '^src/features/' },
      to: { path: '^app/' },
    },
    {
      name: 'routes-only-features-components',
      severity: 'error',
      comment:
        'Expo Router routes (client/app/**) may import src/features, src/components, src/design-system, ' +
        'src/runtime (the container context), and type-only from src/domain. Never data/*, services impls, or supabase at runtime.',
      from: { path: '^app/' },
      to: {
        path: '^(src/data/|src/services/impl/|node_modules/@supabase|node_modules/expo-sqlite)',
        dependencyTypesNot: ['type-only'],
      },
    },
    {
      name: 'routes-no-domain-runtime',
      severity: 'error',
      comment: 'routes may type-import domain entities/helpers but must not embed domain policy decisions.',
      from: { path: '^app/' },
      to: { path: '^src/domain/(pr|policy|snapshot)/', dependencyTypesNot: ['type-only'] },
    },
    {
      name: 'components-are-presentational',
      severity: 'error',
      comment:
        'components/ and design-system/ may not import features/, data/, or supabase at runtime. ' +
        'Type-only imports of domain entity shapes are allowed.',
      from: { path: '^src/(components|design-system)/' },
      to: {
        path: '^(src/features/|src/data/|node_modules/@supabase)',
        dependencyTypesNot: ['type-only'],
      },
    },
    {
      name: 'components-no-domain-runtime',
      severity: 'error',
      comment: 'components/ may type-import domain entities but must not run domain logic.',
      from: { path: '^src/(components|design-system)/' },
      to: { path: '^src/domain/', dependencyTypesNot: ['type-only'] },
    },
    {
      name: 'app-no-data-domain',
      severity: 'error',
      comment: 'app/ routes may only import features/*, components/, design-system/.',
      from: { path: '^src/app/' },
      to: { path: '^(src/data/|node_modules/@supabase)' },
    },
    {
      name: 'repositories-no-remote',
      severity: 'error',
      comment: 'data/repositories are interfaces only — no data/remote, no data/local, no supabase.',
      from: { path: '^src/data/repositories/' },
      to: { path: '^(src/data/remote/|src/data/local/|node_modules/@supabase)' },
    },
    {
      name: 'local-no-remote',
      severity: 'error',
      comment: 'data/local must not reach the network layer; sync mediates.',
      from: { path: '^src/data/local/' },
      to: { path: '^(src/data/remote/|src/features/|node_modules/@supabase)' },
    },
    {
      name: 'remote-no-domain-policy',
      severity: 'error',
      comment: 'data/remote may import domain TYPES only, never domain policies/calc, and never features/ or data/local.',
      from: { path: '^src/data/remote/' },
      to: { path: '^(src/domain/(calc|pr|policy|snapshot)/|src/features/|src/data/local/)' },
    },
    {
      name: 'only-remote-imports-supabase',
      severity: 'error',
      comment: 'The Supabase client is confined to src/data/remote (CON-4, CON-5).',
      from: { pathNot: '^src/data/remote/' },
      to: { path: '^node_modules/@supabase/' },
    },
    {
      name: 'only-local-imports-sqlite-driver',
      severity: 'error',
      comment: 'expo-sqlite is only used inside data/local (the driver adapter).',
      from: { pathNot: '^src/data/local/' },
      to: { path: '^node_modules/expo-sqlite/' },
    },
    {
      name: 'no-orphans',
      severity: 'warn',
      from: { orphan: true, pathNot: '\\.d\\.ts$' },
      to: {},
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    // Test files + the test harness legitimately cross layers (they wire fakes
    // to real repos). The boundary gate is about SOURCE, not tests.
    exclude: { path: '(__tests__/|\\.test\\.ts$|^src/test/)' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    },
    reporterOptions: {
      text: { highlightFocused: true },
    },
  },
};
