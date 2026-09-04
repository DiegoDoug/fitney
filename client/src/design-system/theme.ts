/**
 * Theme object + provider hook. Tokens support light + dark from day one
 * (VIS-DEC-03, roadmap OQ-8 — dark at launch is a Product call; the tokens are
 * ready regardless). `system` follows the OS; the user may override to
 * `light`/`dark` (FR-SET-01, profiles.theme).
 */
import { createContext, useContext } from 'react';
import { lightColors, darkColors, spacing, radius, sizing, motion, type ColorTokens } from './tokens';
import { type } from './typography';

export type ThemeName = 'light' | 'dark';
export type ThemePreference = 'system' | 'light' | 'dark';

export type Theme = {
  name: ThemeName;
  colors: ColorTokens;
  spacing: typeof spacing;
  radius: typeof radius;
  sizing: typeof sizing;
  motion: typeof motion;
  type: typeof type;
};

export function buildTheme(name: ThemeName): Theme {
  return {
    name,
    colors: name === 'dark' ? darkColors : lightColors,
    spacing,
    radius,
    sizing,
    motion,
    type,
  };
}

export const ThemeContext = createContext<Theme>(buildTheme('light'));

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

export function resolveThemeName(pref: ThemePreference, systemIsDark: boolean): ThemeName {
  if (pref === 'system') return systemIsDark ? 'dark' : 'light';
  return pref;
}
