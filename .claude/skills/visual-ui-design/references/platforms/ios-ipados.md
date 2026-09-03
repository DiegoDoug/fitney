# iOS and iPadOS

Verify current Apple Human Interface Guidelines and Design Resources when OS-generation details matter.

For native/adapted work or any HIG-compliance claim, also load [../capabilities/apple-hig-adapter.md](../capabilities/apple-hig-adapter.md).

## Compliance levels

### iOS native

Use Apple conventions by default: system navigation and presentation models, semantic system colors, San Francisco, SF Symbols where available, safe areas, Dynamic Type, Dark Mode, accessibility settings, platform gestures, and standard component semantics. Record the targeted OS generation and avoid unavailable APIs or symbols.

### iOS adapted

Preserve native interaction/component logic, safe areas, gestures, touch ergonomics, text scaling, accessibility, and presentation behavior while allowing stronger brand typography, color, surfaces, illustration, and selected custom controls.

### iOS inspired

Borrow selected visual qualities for web or cross-platform work. Do not imply native behavior or HIG compliance. Re-specify focus, hover, keyboard, responsiveness, and semantics for the actual platform.

## iPad-specific pressures

Account for split views and resizable windows, pointer and keyboard use, large-canvas layouts, sidebars/toolbars/inspectors, drag and drop, multitasking, orientation changes, and preserving context across columns. Do not simply scale up an iPhone screen.

## Validation

Check safe areas, readable/scalable text, touch targets, light/dark/high-contrast behavior, VoiceOver labels/order, Reduce Motion, localization, SF Symbol availability, modal/sheet semantics, and whether custom styling preserves familiar behavior.
