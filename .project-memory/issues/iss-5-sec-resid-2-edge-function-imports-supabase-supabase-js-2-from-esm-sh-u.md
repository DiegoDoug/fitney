---
id: "ISS-5"
kind: "issue"
title: "SEC-RESID-2: Edge Function imports @supabase/supabase-js@2 from esm.sh unpinned — supply-chain exposure"
notion_page_id: "3cfe6070-43bc-81fb-9cb6-d1d544ed4a48"
notion_url: "https://app.notion.com/p/SEC-RESID-2-Edge-Function-imports-supabase-supabase-js-2-from-esm-sh-unpinned-supply-chain-expos-3cfe607043bc81fb9cb6d1d544ed4a48"
created: "2026-09-02T17:34:00.000Z"
last_edited: "2026-09-02T23:40:00.000Z"
status: "Resolved"
---

# SEC-RESID-2: Edge Function imports @supabase/supabase-js@2 from esm.sh unpinned — supply-chain exposure

## Summary

supabase/functions/delete-account/index.ts imports @supabase/supabase-js@2 from esm.sh without an exact version or integrity lock.

## Type

Risk

## Priority

Medium

## Evidence

supabase/functions/delete-account/index.ts; docs/security/security-identity.md §5 SEC-REQ-SEC-03, §9 SEC-RESID-2.

## Proposed Resolution

RESOLVED 2026-09-02 by platform-release (phase 8). supabase/functions/delete-account/ now has deno.json (imports map pinning @supabase/supabase-js to exact npm:@supabase/supabase-js@2.112.4 — the newest stable outside Deno's 24h supply-chain minimum-dependency-age window) + deno.lock (SHA-512 integrity for the full transitive tree: auth-js, functions-js, phoenix, postgrest-js, realtime-js, storage-js, supabase-js, tslib, iceberg-js). index.ts import changed from the unpinned https://esm.sh/@supabase/supabase-js@2 to the bare specifier @supabase/supabase-js. deno check --config=deno.json index.ts passes. Residual (C-5): pinned to 2.112.4 not the latest 2.114.0 pending min-age; hosted deno.lock reproducibility to confirm on first supabase functions deploy.
