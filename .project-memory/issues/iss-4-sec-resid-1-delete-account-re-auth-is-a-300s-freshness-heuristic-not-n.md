---
id: "ISS-4"
kind: "issue"
title: "SEC-RESID-1: delete-account re-auth is a 300s freshness heuristic, not nonce-based reauthentication"
notion_page_id: "3cfe6070-43bc-81b8-aed6-e4b50ecbb3b2"
notion_url: "https://app.notion.com/p/SEC-RESID-1-delete-account-re-auth-is-a-300s-freshness-heuristic-not-nonce-based-reauthentication-3cfe607043bc81b8aed6e4b50ecbb3b2"
created: "2026-09-02T17:34:00.000Z"
last_edited: "2026-09-02T17:42:00.000Z"
status: "Open"
---

# SEC-RESID-1: delete-account re-auth is a 300s freshness heuristic, not nonce-based reauthentication

## Summary

The delete-account Edge Function gates the irreversible action on token iat AND last_sign_in_at both being within 300 seconds. A very fresh stolen token paired with a fresh sign-in could still trigger deletion. Human disposition 2026-09-02: acceptable as a DEVELOPMENT-ONLY heuristic; it must NOT survive into beta.

## Type

Risk

## Priority

Medium

## Evidence

docs/security/security-identity.md §9 (SEC-RESID-1); supabase/functions/delete-account/index.ts.

## Proposed Resolution

Server-verifiable recent authentication (GoTrue /reauthenticate nonce, or explicit password re-entry validated server-side) must REPLACE the 300s heuristic BEFORE beta (not merely before GA). Tracked as roadmap WORK-021. Owner: security-identity + client-engineering.
