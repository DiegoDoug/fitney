# Fitney client (Expo / React Native)

Lifecycle phase 5 — `client-engineering`. See `../docs/engineering/client-implementation.md`
for the full phase artifact (scope, decisions, verification, conditions).

## Status (first pass, 2026-09-03)

**Foundation gate + all logic layers.** Screens are wired but **not** device-verified
(WORK-007); sync is verified against a contract-modelling fake, not real Supabase
(WORK-013).

## Layout (system-architecture.md §6.1)

```
app/                      Expo Router routes (Today · Plan · Log(+) · Progress · Library)
src/
  design-system/          tokens (light+dark), typography (fallback), elevation, theme
  components/              presentational primitives + SetRow (the signature component)
  features/               controllers / view-models  (logging vertical slice, library search)
  domain/                 PURE — entities, units, calc, pr, week, snapshot, policy, uuid5
  services/               interfaces + impls  (clock, ids, connectivity, logger, analytics, config, haptics, units)
  data/
    repositories/         repository INTERFACES
    local/                SQLite driver seam, migrations, local repos, outbox writer
    sync/                 outbox push, hybrid pull, reconciliation, conflict classify, engine
    remote/               typed Zod-validated Supabase gateway + secure session storage  (only dir that imports supabase-js)
  runtime/                composition root + React context
  test/                   better-sqlite3 driver, fake gateway, golden vectors, harness
```

The **layered dependency rule** (ADR-0002) is enforced by `.dependency-cruiser.cjs`
and the `client-verify` CI workflow — a cross-layer import fails the build.

## Develop

```
npm install            # or: npx expo install   (resolves + locks the SDK-54 native tree; generates package-lock.json)
npm start              # Expo Go
```

Copy `.env.example` → `.env` and fill `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`
(anon key only — never a service-role key; CON-4).

## Verify (what CI runs)

```
npm run typecheck:logic   # strict tsc over domain/services/data/features
npm run lint:boundaries   # dependency-cruiser — the layered rule
npm run test              # 40 logic/sync/migration/WORK-020 tests (better-sqlite3, no RN runtime)
```

`npm run typecheck` (full app, incl. `app/` routes + `data/remote/gateway.ts`) and
`jest-expo` component tests need the full native install and are wired into CI
with the screen-verification slice.
