import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { FlatList, View } from 'react-native';
import { Screen, AppText, AppSurface } from '@/components/ui';
import { useRuntime } from '@/runtime/context';
import type { WorkoutSession } from '@/domain/entities';

/**
 * Progress (SPEC §7.5). This pass ships History (the completed-session list that
 * the logging slice produces). Overview / PRs / Trends land in the Data & Progress
 * increment (SPEC §18 Phase 3). Displayed values trace to completed performed
 * sets via the derived tables the recompute writes.
 */
export default function ProgressScreen() {
  const rt = useRuntime();
  const [history, setHistory] = useState<WorkoutSession[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (rt.status !== 'ready') return;
      let cancelled = false;
      void rt.container.repos.session.listCompleted(rt.userId, 100).then((rows) => {
        if (!cancelled) setHistory(rows);
      });
      return () => {
        cancelled = true;
      };
    }, [rt]),
  );

  return (
    <Screen>
      <AppText token="title1">Progress</AppText>
      <View style={{ height: 12 }} />
      {history.length === 0 ? (
        <AppSurface>
          <AppText color="textMuted">No completed workouts yet.</AppText>
        </AppSurface>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(s) => s.id}
          renderItem={({ item }) => (
            <AppSurface style={{ marginBottom: 8 }}>
              <AppText token="heading">{item.name_snapshot}</AppText>
              <AppText token="caption" color="textMuted" tabular>
                {item.started_at.slice(0, 10)}
              </AppText>
            </AppSurface>
          )}
        />
      )}
    </Screen>
  );
}
