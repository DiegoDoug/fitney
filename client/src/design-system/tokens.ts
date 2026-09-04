/**
 * Design tokens — visual-ui-design.md §6.1 (VIS-DEC-03 "white sand / Persian blue"),
 * §6.3 (spacing / sizing / radius / elevation). Semantic names only; every colour
 * token has a light + dark value.
 *
 * VIS-DEC-06: no state may be carried by hue or elevation alone — components pair
 * every state with >=2 of {glyph, weight, border-style, shape, text}. These tokens
 * only provide the palette; the rule is enforced in the components.
 */

// ---- raw ramps (not consumed directly outside this file) --------------------
const sand = {
  s0: '#FBF9F4',
  s50: '#F4F1EA',
  s100: '#ECE8DE',
  s150: '#E4DFD0',
  s200: '#D6CFBC',
  s300: '#BCB39B',
  s600: '#6B6455',
  s800: '#33302A',
  s900: '#201E19',
} as const;

const blue = {
  b50: '#EEF1FB',
  b100: '#DEE4F6',
  b200: '#B9C4EC',
  b300: '#8B9EE0',
  b400: '#5B73D2',
  b500: '#3450C4',
  b600: '#1C39BB',
  b700: '#182F94',
  b900: '#0E1A4F',
} as const;

const ink = {
  i900: '#14130F',
  i850: '#1B1A15',
  i800: '#211F19',
  i700: '#2B2820',
  i600: '#37332A',
  i400: '#6A6454',
  i200: '#C9C4B6',
  i50: '#F2EFE6',
} as const;

export type ColorTokens = {
  canvas: string;
  surface: string;
  surfaceRaised: string;
  surfaceSunken: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderStrong: string;
  accent: string;
  accentPressed: string;
  accentQuiet: string;
  onAccent: string;
  focusRing: string;
  danger: string;
  nmHighlight: string;
  nmShadow: string;
};

export const lightColors: ColorTokens = {
  canvas: sand.s50,
  surface: sand.s100,
  surfaceRaised: sand.s0,
  surfaceSunken: sand.s150,
  text: sand.s900,
  textSecondary: sand.s800,
  textMuted: sand.s600,
  border: sand.s200,
  borderStrong: sand.s300,
  accent: blue.b600,
  accentPressed: blue.b700,
  accentQuiet: blue.b50,
  onAccent: '#FFFFFF',
  focusRing: blue.b500,
  danger: '#9B2C2C',
  nmHighlight: 'rgba(255,255,255,0.6)',
  nmShadow: 'rgba(150,140,110,0.35)',
};

export const darkColors: ColorTokens = {
  canvas: ink.i900,
  surface: ink.i850,
  surfaceRaised: ink.i800,
  surfaceSunken: ink.i700,
  text: ink.i50,
  textSecondary: ink.i200,
  textMuted: ink.i400,
  border: ink.i600,
  borderStrong: ink.i400,
  accent: blue.b300,
  accentPressed: blue.b200,
  accentQuiet: 'rgba(139,158,224,0.16)',
  onAccent: ink.i900,
  focusRing: blue.b300,
  danger: '#F2B8B5',
  nmHighlight: 'rgba(255,255,255,0.04)',
  nmShadow: 'rgba(0,0,0,0.55)',
};

// ---- spacing (4 dp base; visual-ui-design.md §6.3) -------------------------
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

// ---- radius (role-based, optical step-down) ------------------------------
export const radius = {
  field: 12,
  setRow: 12,
  listCard: 16,
  primaryCard: 20,
  sheet: 24,
  pill: 999,
} as const;

// ---- sizing (§6.3) -------------------------------------------------------
export const sizing = {
  minControlHeight: 48,
  primaryCtaHeight: 52,
  setRowHeight: 56,
  setRowReflowHeight: 64,
  numericWell: 40,
  navBarHeight: 56,
  minTouchTarget: 48,
} as const;

// ---- elevation roles (§6.3) — one highlight/shadow pair per surface -------
export type ElevationRole = 'flat' | 'raised-1' | 'raised-2' | 'overlay';

// ---- motion (SPEC §8.7) --------------------------------------------------
export const motion = {
  stateFeedbackMs: 150, // 120-180
  navTransitionMs: 260, // 220-300
  setRowChoreoMs: 140, // VIS-DEC-04 prescribed -> active -> recorded
} as const;
