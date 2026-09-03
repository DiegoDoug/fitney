---
id: "ISS-22"
kind: "issue"
title: "Accessibility / visual-verification risk: monochrome + neumorphic system and unverified-on-device visual design"
notion_page_id: "3cfe6070-43bc-811b-b0fb-cc10a39a055a"
notion_url: "https://app.notion.com/p/Accessibility-visual-verification-risk-monochrome-neumorphic-system-and-unverified-on-device-vi-3cfe607043bc811bb0fbcc10a39a055a"
created: "2026-09-02T20:18:00.000Z"
last_edited: "2026-09-02T20:18:00.000Z"
status: "Open"
---

# Accessibility / visual-verification risk: monochrome + neumorphic system and unverified-on-device visual design

## Summary

Consolidated standing risk. (RISK-6 / UX-RISK-3 / VIS-RISK-2) The monochrome + softly-neumorphic direction risks making completion / PR / selection / focus / error / disabled hard to distinguish — degrading the core logging read and accessibility. (UX-RISK-1) UX validated only by description + an analogical reference; real-device gym use may invalidate reach/keyboard/interruption assumptions. (UX-RISK-2) One-tap set completion without confirmation risks accidental completions undo doesn't fully catch. (UX-RISK-4) "Saved on device" vs "synced" may be misunderstood. (UX-RISK-5) Progress headline metrics ambiguous with sparse data. (VIS-RISK-1) Persian blue #1C39BB is dark/saturated; large fills may vibrate against warm sand. (VIS-RISK-3) "Ledger" flatness may read as unfinished. (VIS-RISK-4) Android cannot render the dual neumorphic pair — documented fallback. (VIS-RISK-6) Visual system validated in a browser prototype, not on device (Dynamic Type reflow, VoiceOver order, RTL, real shadows unverified).

## Type

Risk

## Priority

Medium

## Evidence

development-roadmap.md RISK-6, UX-RISK-1–5, VIS-RISK-1–6; product-strategy invariant #10; VIS-DEC-06. Owner: visual-ui-design + evidence-based-ui-ux + quality-engineering.

## Proposed Resolution

Mitigated by: invariant #10 + VIS-DEC-06 (≥2 non-colour/elevation cues per state) + NFR-A11Y audit gate; WORK-007 on-device verification (Dynamic Type, VoiceOver/TalkBack order, RTL, measured contrast, Persian-blue weight on sand); WORK-002 moderated on-device gym session; a defined reversal path for failure/drop set types.
