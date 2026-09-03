---
id: "TASK-7"
kind: "task"
title: "Enable main branch protection requiring db-verify"
notion_page_id: "3d0e6070-43bc-81fd-914c-f10e97084cbf"
notion_url: "https://app.notion.com/p/Enable-main-branch-protection-requiring-db-verify-3d0e607043bc81fd914cf10e97084cbf"
created: "2026-09-03T04:49:00.000Z"
last_edited: "2026-09-03T17:02:00.000Z"
status: "Done"
---

# Enable main branch protection requiring db-verify

## Scope

Configure GitHub branch protection for the private DiegoDoug/fitney repository so merges to main require the db-verify status check.

## Priority

High

## Executor

Human

## Definition of Done

main cannot merge changes unless the db-verify workflow passes; protection is confirmed with repository settings or a safe test PR.

## Verification

Not Run

## Commit / PR

https://github.com/DiegoDoug/fitney (Protect Main ruleset id 22205300) + verification in https://github.com/DiegoDoug/fitney/pull/1
