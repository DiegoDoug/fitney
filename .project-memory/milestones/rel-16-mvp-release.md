---
id: "REL-16"
kind: "milestone"
title: "MVP release"
notion_page_id: "3cfe6070-43bc-812d-a078-c27222d5e14b"
notion_url: "https://app.notion.com/p/MVP-release-3cfe607043bc812da078c27222d5e14b"
created: "2026-09-02T20:16:00.000Z"
last_edited: "2026-09-02T20:16:00.000Z"
status: "Planned"
---

# MVP release

## Objective

A single user can: create an account + configure units; find/create exercises; build or copy a weekly plan; start today's planned / repeat / empty workout; log weight/reps/time/distance sets offline with reliable recovery; finish a workout and see immutable historical values; view history, core PRs, basic trends; reuse templates + archive library items without historical coupling; sync across sessions/devices with visible failure recovery; export data + request account deletion.

## Type

Release

## Exit Criteria

Per docs/product/product-strategy.md §11.1: must also pass cross-account RLS isolation, offline recovery, DB migration (fresh + upgrade), accessibility (WCAG AA on meaningful text/controls, screen-reader traversal), and core performance checks on representative physical iOS + Android devices. Delivery sequencing §11.2: Foundation → Logging vertical slice (prove first) → Weekly planning → Data & progress → Full library & data ownership → Production hardening. No target date set.
