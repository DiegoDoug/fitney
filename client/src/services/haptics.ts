/**
 * Haptics — SPEC §8.7: only for set completion, timer completion, and
 * destructive confirmations; honours the user's `haptics` preference.
 * Native impl (expo-haptics) is added with the screen slice; the interface is
 * here so features/domain stay testable and Expo-Go-boundary clean.
 */
export type HapticKind = 'setComplete' | 'timerComplete' | 'destructiveConfirm';

export interface Haptics {
  fire(kind: HapticKind): void;
}

export const noopHaptics: Haptics = { fire: () => {} };
