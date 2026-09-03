// Flat ESLint config. Strict TS + the layered-boundary rule (ADR-0002).
// The authoritative boundary gate is `.dependency-cruiser.cjs` (npm run
// lint:boundaries); eslint-plugin-boundaries is a fast in-editor mirror.
const tseslint = require('typescript-eslint');
const boundaries = require('eslint-plugin-boundaries');

module.exports = tseslint.config(
  {
    ignores: ['node_modules/**', 'dist/**', '.expo/**', 'babel.config.js', 'metro.config.js', '*.cjs'],
  },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: { boundaries },
    settings: {
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app/**' },
        { type: 'components', pattern: 'src/components/**' },
        { type: 'design-system', pattern: 'src/design-system/**' },
        { type: 'features', pattern: 'src/features/**' },
        { type: 'domain', pattern: 'src/domain/**' },
        { type: 'services', pattern: 'src/services/**' },
        { type: 'repositories', pattern: 'src/data/repositories/**' },
        { type: 'local', pattern: 'src/data/local/**' },
        { type: 'sync', pattern: 'src/data/sync/**' },
        { type: 'remote', pattern: 'src/data/remote/**' },
      ],
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            { from: 'app', allow: ['features', 'components', 'design-system'] },
            { from: 'components', allow: ['components', 'design-system'] },
            { from: 'design-system', allow: ['design-system'] },
            { from: 'features', allow: ['domain', 'services', 'repositories', 'components', 'design-system'] },
            { from: 'domain', allow: ['domain'] },
            { from: 'services', allow: ['services', 'domain'] },
            { from: 'repositories', allow: ['domain', 'services'] },
            { from: 'local', allow: ['repositories', 'domain', 'services', 'local'] },
            { from: 'sync', allow: ['repositories', 'domain', 'services', 'local', 'remote', 'sync'] },
            { from: 'remote', allow: ['domain', 'services', 'remote'] },
          ],
        },
      ],
    },
  },
);
