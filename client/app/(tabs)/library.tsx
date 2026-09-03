import { useCallback, useMemo, useState } from 'react';
import { FlatList, TextInput, View } from 'react-native';
import { Screen, AppText, AppSurface } from '@/components/ui';
import { useTheme } from '@/design-system/theme';
import { useRuntime } from '@/runtime/context';
import type { Exercise } from '@/domain/entities';
import type { SearchState } from '@/features/library/exercise-search';

/**
 * Library (SPEC §7.6). This pass ships the Exercises collection with local
 * indexed search (SM-7). Supersets / Workouts / Weeks land in the Complete-
 * library increment (SPEC §18 Phase 4). States: empty (recents), typing,
 * results, no-results.
 */
export default function LibraryScreen() {
  const t = useTheme();
  const rt = useRuntime();
  const [state, setState] = useState<SearchState>({ kind: 'empty', recents: [] });
  const [text, setText] = useState('');

  const search = useMemo(() => (rt.status === 'ready' ? rt.container.exerciseSearch : null), [rt]);

  const onChange = useCallback(
    async (v: string) => {
      setText(v);
      if (rt.status !== 'ready' || !search) return;
      setState(await search.query(rt.userId, v));
    },
    [rt, search],
  );

  const items: Exercise[] =
    state.kind === 'results' ? state.items : state.kind === 'empty' ? state.recents : [];

  return (
    <Screen>
      <AppText token="title1">Library</AppText>
      <TextInput
        accessibilityLabel="Search exercises"
        placeholder="Search exercises"
        placeholderTextColor={t.colors.textMuted}
        value={text}
        onChangeText={onChange}
        style={{
          marginTop: 12,
          minHeight: t.sizing.minControlHeight,
          borderWidth: 1,
          borderColor: t.colors.borderStrong,
          borderRadius: t.radius.field,
          paddingHorizontal: t.spacing.md,
          color: t.colors.text,
        }}
      />
      <View style={{ height: 12 }} />
      {state.kind === 'no-results' ? (
        <AppText color="textMuted">Nothing matches “{state.query}”.</AppText>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(e) => e.id}
          ListHeaderComponent={
            state.kind === 'empty' ? <AppText token="caption" color="textMuted">RECENT</AppText> : null
          }
          renderItem={({ item }) => (
            <AppSurface style={{ marginBottom: 8 }}>
              <AppText token="heading">{item.name}</AppText>
              <AppText token="caption" color="textMuted">
                {item.tracking_mode}
              </AppText>
            </AppSurface>
          )}
        />
      )}
    </Screen>
  );
}
