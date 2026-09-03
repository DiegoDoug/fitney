/**
 * Typography tokens — visual-ui-design.md §6.2 (VIS-DEC-07).
 *
 * Aeonik is NOT used until the exact files, weights, and mobile app-distribution
 * licence are confirmed (CON-8, DEP-2, OQ-2). Until then the documented fallback
 * stack ships. No synthesized weights: each token maps to a real face in the
 * fallback stack. Layout is typeface-independent, so swapping in Aeonik later is
 * a token change, not a layout change.
 */
import { Platform } from 'react-native';

// Documented fallback stack (visual-ui-design.md §6.2).
export const FONT_FALLBACK_STACK =
  '"Inter", "SF Pro Text", -apple-system, "Segoe UI", Roboto, system-ui, sans-serif';

// RN takes a single family name, not a CSS stack; use the platform system face
// until Aeonik / bundled Inter is wired (WORK-008 also locks the icon family).
const systemFamily = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });

export type TypeToken = {
  fontSize: number;
  lineHeight: number;
  fontWeight: '400' | '500' | '600' | '700';
  fontFamily: string;
  /** figures that must not shift width (timers, loads, reps, dates, chart values) */
  tabular?: boolean;
};

export const type: Record<
  'display' | 'title1' | 'title2' | 'heading' | 'body' | 'label' | 'caption' | 'metric',
  TypeToken
> = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: '700', fontFamily: systemFamily },
  title1: { fontSize: 28, lineHeight: 34, fontWeight: '700', fontFamily: systemFamily },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: '600', fontFamily: systemFamily },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '500', fontFamily: systemFamily },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400', fontFamily: systemFamily },
  label: { fontSize: 14, lineHeight: 18, fontWeight: '500', fontFamily: systemFamily },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400', fontFamily: systemFamily },
  metric: { fontSize: 20, lineHeight: 24, fontWeight: '500', fontFamily: systemFamily, tabular: true },
};

/** Applied via `fontVariant: ['tabular-nums']` where supported. */
export const TABULAR_FONT_VARIANT = ['tabular-nums'] as const;
