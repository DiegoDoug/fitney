import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { router } from 'expo-router';
import { View } from 'react-native';
import { Screen, AppText, AppSurface, PrimaryButton } from '@/components/ui';
import { useTheme } from '@/design-system/theme';
import { useRuntime } from '@/runtime/context';
import type { WorkoutSession } from '@/domain/entities';

/**
 * Today (SPEC §7.1). Hierarchy: date -> week strip -> ACTIVE workout above all ->
 * planned workout -> weekly status -> latest completed. Renders from local data
 * only; a "Saved on device" sync indicator, never a blocking banner.
 *
 * States implemented: loading, signed-out, active-session, no-plan (empty),
 * offline (implicit — no network on this path).
 */
export default function TodayScreen() {
  const t = useTheme();
  const rt = useRuntime();
  const [active, setActive] = useState<WorkoutSession | null>(null);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (rt.status !== 'ready') return;
      let cancelled = false;
      void rt.container.sessions.restoreActive(rt.userId).then((s) => {
        if (!cancelled) {
          setActive(s);
          setLoaded(true);
        }
      });
      return () => {
        cancelled = true;
      };
    }, [rt]),
  );

  if (rt.status === 'loading') {
    return (
      <Screen>
        <AppText token="title1">Today</AppText>
        <AppText color="textMuted">Loading…</AppText>
      </Screen>
    );
  }
  if (rt.status === 'signed-out') {
    return (
      <Screen>
        <View style={{ flex: 1, justifyContent: 'center', gap: t.spacing.lg }}>
          <AppText token="display">Fitney</AppText>
          <AppText color="textMuted">Sign in to plan and log your training.</AppText>
          <PrimaryButton label="Sign in" onPress={() => router.push('/(auth)/sign-in')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <AppText token="title1">Today</AppText>
        <AppText
          token="label"
          color="accent"
          accessibilityRole="button"
          accessibilityLabel="Settings"
          onPress={() => router.push('/settings')}
        >
          Settings
        </AppText>
      </View>
      <View style={{ height: t.spacing.lg }} />

      {!loaded ? (
        <AppText color="textMuted">Loading…</AppText>
      ) : active ? (
        <AppSurface role="raised-2" style={{ borderColor: t.colors.accent, borderWidth: 1.5 }}>
          <AppText token="caption" color="textMuted">
            ACTIVE WORKOUT
          </AppText>
          <AppText token="title2">{active.name_snapshot}</AppText>
          <View style={{ height: t.spacing.md }} />
          <PrimaryButton
            label="Resume workout"
            onPress={() => router.push({ pathname: '/workout/active/[sessionId]', params: { sessionId: active.id } })}
          />
        </AppSurface>
      ) : (
        <AppSurface>
          <AppText token="heading">Nothing planned for today</AppText>
          <AppText color="textMuted">Repeat your last workout, choose a template, or start empty.</AppText>
          <View style={{ height: t.spacing.md }} />
          <PrimaryButton label="Start or log a workout" isLogAction onPress={() => router.push('/log')} />
        </AppSurface>
      )}

      <View style={{ height: t.spacing.xxl }} />
      <AppText token="caption" color="textMuted">
        Saved on device
      </AppText>
    </Screen>
  );
}
