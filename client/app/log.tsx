import { useState } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import { Screen, AppText, PrimaryButton } from '@/components/ui';
import { useTheme } from '@/design-system/theme';
import { useRuntime } from '@/runtime/context';

/**
 * Log Action Sheet (SPEC §4.1). Context-aware: "Resume workout" is first + visually
 * dominant when a session is active; otherwise Start today's / Repeat last /
 * Choose template / Start empty / Log a past workout. Impossible actions are
 * hidden, not disabled. This pass wires "Start empty" end-to-end (the vertical
 * slice); the others are stubbed for the planning / library increments.
 */
export default function LogSheet() {
  const t = useTheme();
  const rt = useRuntime();
  const [busy, setBusy] = useState(false);

  const startEmpty = async () => {
    if (rt.status !== 'ready' || busy) return;
    setBusy(true);
    try {
      const session = await rt.container.sessions.startSession({
        userId: rt.userId,
        name: 'Workout',
        source: 'empty',
        plannedWorkoutId: null,
        items: [],
      });
      router.replace({ pathname: '/workout/active/[sessionId]', params: { sessionId: session.id } });
    } catch (e) {
      // ActiveSessionExistsError -> route to the existing session
      const id = (e as { activeSessionId?: string }).activeSessionId;
      if (id) router.replace({ pathname: '/workout/active/[sessionId]', params: { sessionId: id } });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <AppText token="title2">Start or log a workout</AppText>
      <View style={{ height: t.spacing.lg, gap: t.spacing.md }}>
        <PrimaryButton label="Start empty workout" loading={busy} onPress={startEmpty} isLogAction />
        <PrimaryButton label="Repeat last workout" variant="secondary" disabled onPress={() => {}} />
        <PrimaryButton label="Choose a workout template" variant="secondary" disabled onPress={() => {}} />
        <PrimaryButton label="Log a past workout" variant="secondary" disabled onPress={() => {}} />
        <PrimaryButton label="Cancel" variant="secondary" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
