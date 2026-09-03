---
id: "REQ-2"
kind: "requirement"
title: "FR-AUTH-02 — Secrets only in platform-secure storage; no privileged server credential in client"
notion_page_id: "3cfe6070-43bc-810d-85bb-cd416c393bf7"
notion_url: "https://app.notion.com/p/FR-AUTH-02-Secrets-only-in-platform-secure-storage-no-privileged-server-credential-in-client-3cfe607043bc810d85bbcd416c393bf7"
created: "2026-09-02T20:11:00.000Z"
last_edited: "2026-09-02T20:11:00.000Z"
status: "Approved"
---

# FR-AUTH-02 — Secrets only in platform-secure storage; no privileged server credential in client

## Description

Authentication secrets are held only in platform-secure storage; no privileged server credential ever ships in the client.

## Type

Functional

## Priority

Critical

## Acceptance Criteria

Tokens in expo-secure-store; service-role key never shipped/requested (CON-4). Adversarial + code review.

## Source

SPEC AUTH-02, CLAUDE.md; docs/product/product-strategy.md §8.1. Priority P0.

## Verified

false
