# Apple HIG platform attachment

Load this attachment only for native iOS/iPadOS work, Apple-platform design review, SwiftUI/UIKit handoff, or an explicit HIG-compliance claim. Also read [../platforms/ios-ipados.md](../platforms/ios-ipados.md).

The current [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/) and platform documentation are authoritative. Verify version-sensitive behavior before specifying APIs, component availability, symbol names, dimensions, or submission requirements. A third-party checklist may route attention but cannot establish compliance.

## Declare the target

Record:

- target devices and minimum OS versions;
- iPhone, iPad, or universal layout;
- portrait, landscape, resizable-window, keyboard, pointer, Pencil, and external-display expectations;
- native, adapted, or merely inspired compliance level;
- UIKit, SwiftUI, React Native, Expo, Flutter, web, or another implementation target.

Do not describe a web or cross-platform imitation as HIG-compliant. Translate Apple-inspired qualities to the actual platform's semantics and input modes.

## Navigation and presentation

- Prefer recognizable platform navigation structures unless a documented task model requires another approach.
- Distinguish persistent destination switching from hierarchical drill-down, search, transient tasks, confirmation, and immersive focus.
- Preserve navigation state and user context across columns, tabs, sheets, and window resizing.
- Choose sheets, full-screen covers, popovers, alerts, menus, inspectors, and navigation destinations by task scope and interruption cost, not visual fashion.
- On iPad, evaluate sidebars, split views, inspectors, toolbars, keyboard shortcuts, pointer behavior, drag and drop, and multiwindow use. Do not stretch an iPhone composition.

## Components and input

- Start from system component semantics, then customize appearance without hiding state or expected behavior.
- Use semantic system colors and materials where native adaptation benefits from environment changes.
- Use SF Symbols only after confirming availability, meaning, rendering mode, and localization implications for the target OS.
- Support Dynamic Type, VoiceOver names and order, accessibility actions, Reduce Motion, increased contrast, bold text, and non-color state cues where applicable.
- Treat touch-target adequacy as a validation requirement; verify current Apple guidance rather than copying an unversioned number into every design.
- Define keyboard, pointer, focus, hover, Pencil, and hardware-input behavior when the target device supports them.

## Environment and system states

Specify safe-area behavior; light, dark, and increased-contrast appearances; text expansion; localization; permissions; authentication interruption; offline and degraded states; rotation and window resizing; background/foreground transitions; destructive confirmation; and recovery after partial completion.

## Handoff evidence

A credible handoff includes:

- targeted OS/device matrix and compliance level;
- navigation and presentation rationale;
- component mapping to native primitives or explicit custom behavior;
- adaptive layout rules, not only fixed frames;
- accessibility and environment-state coverage;
- official sources used and access dates;
- rendered evidence at representative compact and regular widths when relevant;
- unresolved implementation checks instead of unsupported compliance claims.

## Provenance

This attachment extends the existing Apple platform reference with useful routing themes found in the [Wondelai iOS HIG Design skill](https://github.com/wondelai/skills/blob/main/ios-hig-design/SKILL.md). The content is independently adapted and keeps Apple as the primary authority.
