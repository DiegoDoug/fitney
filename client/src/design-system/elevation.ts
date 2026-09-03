/**
 * Elevation roles — visual-ui-design.md §6.3 / VIS-DEC-05 (restraint rule).
 *
 * One highlight/shadow pair per surface (upper-left light / lower-right shadow).
 * `raised-2` + full-strength accent is reserved for the four live-session running
 * elements ONLY: active set row, Log button, running rest timer, Resume pill.
 *
 * VIS-RISK-4: Android cannot render a dual neumorphic pair; the Android branch
 * falls back to border + single `elevation`. Borders already carry containment,
 * so no state is lost.
 */
import { Platform, type ViewStyle } from 'react-native';
import type { ColorTokens, ElevationRole } from './tokens';

export function elevationStyle(role: ElevationRole, c: ColorTokens): ViewStyle {
  if (role === 'flat') {
    return { borderWidth: 1, borderColor: c.border };
  }

  if (Platform.OS === 'android') {
    // Single elevation + border (documented fallback).
    const el = role === 'raised-2' ? 6 : role === 'overlay' ? 12 : 3;
    return { elevation: el, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceRaised };
  }

  // iOS: one neumorphic pair.
  const depth =
    role === 'raised-1'
      ? { radius: 6, offsetY: 3, opacity: 1 }
      : role === 'raised-2'
        ? { radius: 10, offsetY: 5, opacity: 1 }
        : { radius: 16, offsetY: 8, opacity: 1 }; // overlay

  return {
    shadowColor: c.nmShadow,
    shadowOffset: { width: depth.offsetY / 2, height: depth.offsetY },
    shadowOpacity: depth.opacity,
    shadowRadius: depth.radius,
    backgroundColor: c.surfaceRaised,
  };
}
