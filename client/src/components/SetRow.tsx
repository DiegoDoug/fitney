/**
 * SetRow — the signature component (VIS-DEC-04). One ruled row, identical across
 * active / past / editor / history (only which columns are live changes).
 * Choreographed moment: prescribed -> active -> recorded (~140ms).
 *
 * VIS-DEC-06: completion is filled marker + check glyph + numeral-weight step —
 * NEVER colour alone. Numeric wells use tabular figures and stay >=40dp inside a
 * >=56dp row. Opening the keypad must not cover the active row (client req).
 */
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useTheme } from '@/design-system/theme';
import { elevationStyle } from '@/design-system/elevation';
import { AppText } from './ui';
import type { PerformedSet } from '@/domain/entities';

export type SetRowState = 'prescribed' | 'active' | 'recorded' | 'error' | 'locked';

export function SetRow({
  set,
  state,
  previous,
  unit,
  onChange,
  onComplete,
  onUncomplete,
}: {
  set: Pick<PerformedSet, 'id' | 'set_type' | 'load_kg' | 'reps' | 'completed'>;
  state: SetRowState;
  previous?: { load_kg: number | null; reps: number | null } | null;
  unit: 'kg' | 'lb';
  onChange?: (patch: { loadKg?: number | null; reps?: number | null }) => void;
  onComplete?: () => void;
  onUncomplete?: () => void;
}) {
  const t = useTheme();
  const [load, setLoad] = useState(set.load_kg == null ? '' : String(set.load_kg));
  const [reps, setReps] = useState(set.reps == null ? '' : String(set.reps));
  const editable = state === 'active' || state === 'error';
  const recorded = state === 'recorded' || set.completed;

  const wellStyle = {
    minWidth: t.sizing.numericWell,
    minHeight: t.sizing.numericWell,
    borderRadius: 10,
    borderWidth: editable ? 1.5 : recorded ? 0 : 1,
    borderStyle: (state === 'prescribed' ? 'dashed' : 'solid') as 'dashed' | 'solid',
    borderColor: state === 'error' ? t.colors.danger : editable ? t.colors.accent : t.colors.borderStrong,
    backgroundColor: t.colors.surfaceSunken,
    paddingHorizontal: t.spacing.sm,
    textAlign: 'right' as const,
    color: t.colors.text,
    fontWeight: (recorded ? '600' : '400') as '400' | '600',
  };

  return (
    <View
      accessibilityLabel={`Set, ${set.set_type}${recorded ? ', recorded' : ''}`}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: t.sizing.setRowHeight,
          gap: t.spacing.sm,
          paddingHorizontal: t.spacing.sm,
          borderRadius: t.radius.setRow,
          borderBottomWidth: 1,
          borderColor: t.colors.border,
        },
        state === 'active' ? elevationStyle('raised-2', t.colors) : null,
        state === 'active' ? { borderWidth: 1.5, borderColor: t.colors.accent } : null,
      ]}
    >
      <AppText token="caption" color="textMuted" style={{ width: 14 }}>
        {set.set_type === 'warmup' ? 'W' : set.set_type === 'working' ? '' : set.set_type[0]?.toUpperCase()}
      </AppText>
      <AppText token="caption" color="textMuted" tabular style={{ width: 64 }}>
        {previous ? `${previous.load_kg ?? '—'}×${previous.reps ?? '—'}` : '—'}
      </AppText>
      <TextInput
        accessibilityLabel={`Load in ${unit}`}
        editable={editable}
        keyboardType="decimal-pad"
        value={load}
        onChangeText={(v) => {
          setLoad(v);
          onChange?.({ loadKg: v === '' ? null : Number(v) });
        }}
        style={wellStyle}
      />
      <TextInput
        accessibilityLabel="Reps"
        editable={editable}
        keyboardType="number-pad"
        value={reps}
        onChangeText={(v) => {
          setReps(v);
          onChange?.({ reps: v === '' ? null : Number(v) });
        }}
        style={wellStyle}
      />
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: recorded }}
        accessibilityLabel={recorded ? 'Mark set not done' : 'Mark set complete'}
        onPress={() => (recorded ? onUncomplete?.() : onComplete?.())}
        disabled={state === 'locked'}
        hitSlop={12}
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: recorded ? 0 : 1,
          borderColor: t.colors.borderStrong,
          backgroundColor: recorded ? t.colors.accent : 'transparent',
        }}
      >
        <AppText token="label" style={{ color: recorded ? t.colors.onAccent : t.colors.textMuted }}>
          {recorded ? '✓' : '○'}
        </AppText>
      </Pressable>
    </View>
  );
}
