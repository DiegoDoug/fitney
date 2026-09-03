---
id: "ADR-2"
kind: "adr"
title: "ADR-0002 — Enforced layered dependency rule"
notion_page_id: "3cfe6070-43bc-8155-9051-d76cbecfe5d6"
notion_url: "https://app.notion.com/p/ADR-0002-Enforced-layered-dependency-rule-3cfe607043bc81559051d76cbecfe5d6"
created: "2026-09-02T20:09:00.000Z"
last_edited: "2026-09-02T20:09:00.000Z"
status: "Accepted"
---

# ADR-0002 — Enforced layered dependency rule

## Context

CON-5 mandates that UI components never call Supabase directly and that access flows through feature logic → domain services → repository interfaces → local repositories → sync → Supabase gateway. Without mechanical enforcement, this erodes (a hook imports supabase-js, an await sneaks onto the render path) and the offline guarantee silently breaks.

## Decision

Adopt the layer set and import matrix in system-architecture.md §6.1: app/ → features/ → (domain/ pure + services/ interfaces + data/repositories interfaces) → data/local + data/sync → data/remote (Supabase gateway). domain/ is pure (no I/O, no RN, no Date.now/Math.random — inject Clock, IdGenerator). components/ and design-system/ import only tokens and React/RN. features/* may not import data/local, data/sync, data/remote, or the Supabase client. The Supabase client is referenced in exactly one directory (data/remote). Enforce with dependency-cruiser (or eslint-plugin-boundaries) wired to a failing CI check, plus a smoke test that runs a full logging flow with the network stubbed to throw (AR-RISK-6). Ships in Phase 0.

## Consequences

Offline correctness and testability hold by construction; domain/* is testable with no device or network. An SDK or backend change has a single blast site. Small upfront cost: boundary config + CI wiring, and occasional friction when a feature "just wants" a query (resolved by adding a repository method). Rejected: convention only (no linter); a single "api" module without the domain/services split. Reversibility: high for tooling, low for the layer shape once features are built on it — which is the point.

## Date

2026-09-02

## Implemented

false

## Supersedes

—
