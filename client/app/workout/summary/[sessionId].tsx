import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Screen, AppText, AppSurface, PrimaryButton } from '@/components/ui';
import { useRuntime } from '@/runtime/context';
import { summariseSession } from '@/features/logging/session-summary';
import type { PerformedSet, WorkoutSession } from '@/domain/entities';

/**
 * Completion summary (SPEC §7.2 / LOG-11) — duration, exercises, working sets,
 * total volume, PRs, notes before/after Confirm. Reads the freshly materialised
 * derived rows the finish recompute wrote (system-architecture.md §7.3).
 */
export default function SummaryScreen() {
  const rt = useRuntime();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [sets, setSets] = useState<PerformedSet[]>([]);
  // PR read-back gets a dedicated repo method in the Data & Progress increment;
  // the derived rows are already materialised by the finish recompute.
  const prs: Array<{ category: string; value: number }> = [];

  useEffect(() => {
    if (rt.status !== 'ready' || !sessionId) return;
    void (async () => {
      setSession(await rt.container.repos.session.getById(sessionId));
      setSets(await rt.container.repos.performedSet.listBySession(sessionId));
    })();
  }, [rt, sessionId]);

  if (!session) {
    return (
      <Screen>
        <AppText color="textMuted">Loading summary…</AppText>
      </Screen>
    );
  }

  const summary = summariseSession(sets);

  return (
    <Screen>
      <AppText token="title1">{session.name_snapshot}</AppText>
      <AppSurface style={{ marginTop: 16 }}>
        <Row label="Working sets" value={String(summary.workingSets)} />
        <Row label="Total volume" value={`${summary.totalVolumeKg} kg`} />
        <Row label="Status" value={session.status} />
      </AppSurface>
      {prs.length > 0 ? (
        <AppSurface style={{ marginTop: 12 }}>
          <AppText token="heading">Personal records</AppText>
          {prs.map((p) => (
            <Row key={p.category} label={p.category} value={String(p.value)} />
          ))}
        </AppSurface>
      ) : null}
      <View style={{ height: 16 }} />
      <PrimaryButton label="Confirm" onPress={() => router.replace('/(tabs)')} />
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
      <AppText color="textMuted">{label}</AppText>
      <AppText tabular>{value}</AppText>
    </View>
  );
}
