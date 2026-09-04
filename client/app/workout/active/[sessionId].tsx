import { useCallback, useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { Screen, AppText, AppSurface, PrimaryButton } from '@/components/ui';
import { SetRow, type SetRowState } from '@/components/SetRow';
import { useTheme } from '@/design-system/theme';
import { useRuntime } from '@/runtime/context';
import type { PerformedSet, SessionExercise, WorkoutSession } from '@/domain/entities';

/**
 * Active workout (SPEC §7.2, UX-DEC-03). Full scrollable session with sticky
 * active-exercise context. Set edits persist immediately + locally (the hot
 * path); "recorded" only after the commit; on persist failure the row shows
 * "Not saved — retrying" and Finish is blocked (AR-DEC-10). Minimising returns to
 * the prior tab with a Resume pill (handled by Today). Back never discards.
 */
export default function ActiveWorkoutScreen() {
  const t = useTheme();
  const rt = useRuntime();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [exercises, setExercises] = useState<SessionExercise[]>([]);
  const [sets, setSets] = useState<PerformedSet[]>([]);
  const [persistError, setPersistError] = useState(false);

  const reload = useCallback(async () => {
    if (rt.status !== 'ready' || !sessionId) return;
    setSession(await rt.container.repos.session.getById(sessionId));
    setExercises(await rt.container.repos.session.listExercises(sessionId));
    setSets(await rt.container.repos.performedSet.listBySession(sessionId));
  }, [rt, sessionId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (rt.status !== 'ready' || !session) {
    return (
      <Screen>
        <AppText color="textMuted">Restoring session…</AppText>
      </Screen>
    );
  }

  const addAndComplete = async (se: SessionExercise) => {
    try {
      const draft = await rt.container.sets.addSet(rt.userId, {
        sessionExerciseId: se.id,
        position: sets.filter((s) => s.session_exercise_id === se.id).length,
      });
      await rt.container.sets.completeSet(rt.userId, draft);
      setPersistError(false);
      await reload();
    } catch {
      setPersistError(true);
    }
  };

  const finish = async () => {
    if (persistError) return; // Finish blocked while a set is unsaved
    await rt.container.sessions.finishSession(rt.userId, session.id);
    router.replace({ pathname: '/workout/summary/[sessionId]', params: { sessionId: session.id } });
  };

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <AppText token="title2">{session.name_snapshot}</AppText>
        <PrimaryButton label="Finish" variant={persistError ? 'secondary' : 'primary'} disabled={persistError} onPress={finish} />
      </View>
      {persistError ? (
        <AppText color="danger">Not saved — retrying. Finish is blocked until it saves.</AppText>
      ) : null}
      <ScrollView style={{ marginTop: t.spacing.md }}>
        {exercises.length === 0 ? (
          <AppSurface>
            <AppText color="textMuted">No exercises yet. Add one from the Library.</AppText>
          </AppSurface>
        ) : (
          exercises.map((se) => {
            const rows = sets.filter((s) => s.session_exercise_id === se.id);
            return (
              <AppSurface key={se.id} style={{ marginBottom: t.spacing.md }}>
                <AppText token="heading">{se.exercise_name_snapshot}</AppText>
                {rows.map((s) => {
                  const state: SetRowState = s.completed ? 'recorded' : 'active';
                  return (
                    <SetRow
                      key={s.id}
                      set={s}
                      state={state}
                      unit="kg"
                      onComplete={() => void rt.container.sets.completeSet(rt.userId, s).then(reload)}
                      onUncomplete={() => void rt.container.sets.uncompleteSet(rt.userId, s).then(reload)}
                      onChange={(patch) => void rt.container.sets.editSet(rt.userId, s, patch)}
                    />
                  );
                })}
                <View style={{ height: t.spacing.sm }} />
                <PrimaryButton label="Add set" variant="secondary" onPress={() => addAndComplete(se)} />
              </AppSurface>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}
