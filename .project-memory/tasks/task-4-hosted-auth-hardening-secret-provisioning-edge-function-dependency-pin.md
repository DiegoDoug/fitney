---
id: "TASK-4"
kind: "task"
title: "Hosted auth hardening + secret provisioning + Edge Function dependency pin"
notion_page_id: "3cfe6070-43bc-81bc-b025-ed5345eddd71"
notion_url: "https://app.notion.com/p/Hosted-auth-hardening-secret-provisioning-Edge-Function-dependency-pin-3cfe607043bc81bcb025ed5345eddd71"
created: "2026-09-02T17:34:00.000Z"
last_edited: "2026-09-02T17:34:00.000Z"
status: "Backlog"
---

# Hosted auth hardening + secret provisioning + Edge Function dependency pin

## Scope

Enable GoTrue email confirmation (prod), user-enumeration protection, leaked-password protection; confirm auth rate limits. Provision SUPABASE_SERVICE_ROLE_KEY and DELETION_RECEIPT_HMAC_KEY as Edge Function env (server-only). Pin @supabase/supabase-js to an exact version + add a Deno lockfile for supabase/functions/delete-account.

## Priority

High

## Executor

Human

## Definition of Done

All auth-config items enabled on the non-dev project; secrets set and confirmed absent from the client bundle; Edge Function import pinned + locked. Hard gate for any non-dev environment.

## Verification

Not Run
