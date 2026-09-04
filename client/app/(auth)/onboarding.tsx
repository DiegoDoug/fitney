import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  Screen,
  AppText,
  PrimaryButton,
  AppTextField,
  FormBanner,
  SegmentedControl,
  NumberStepper,
  type SegmentOption,
} from '@/components/ui';
import { useTheme } from '@/design-system/theme';
import { useAuth, useOnboarding } from '@/runtime/context';
import {
  validateOnboardingInput,
  hasOnboardingErrors,
  type OnboardingFieldErrors,
} from '@/features/onboarding/onboarding-service';
import type { UnitPref } from '@/domain/entities';

const WEEK_DAYS: ReadonlyArray<SegmentOption<number>> = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];
const UNITS: ReadonlyArray<SegmentOption<UnitPref>> = [
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'lb', label: 'Pounds (lb)' },
];

/**
 * Onboarding (SPEC AUTH-03). Asks ONLY: display name, preferred unit, week start
 * day, default rest timer, optional training goal. Resumable — the form prefills
 * from a partial profile; completion is idempotent (the service coalesces the
 * outbox entry and set-once marks the local marker).
 */
export default function OnboardingScreen() {
  const t = useTheme();
  const { user } = useAuth();
  const { draft, submit } = useOnboarding();

  const [displayName, setDisplayName] = useState(draft?.displayName ?? '');
  const [unitPref, setUnitPref] = useState<UnitPref>(draft?.unitPref ?? 'kg');
  const [weekStart, setWeekStart] = useState<number>(draft?.weekStart ?? 1);
  const [restSeconds, setRestSeconds] = useState<number>(draft?.defaultRestSeconds ?? 120);
  const [goal, setGoal] = useState(draft?.trainingGoal ?? '');
  const [errs, setErrs] = useState<OnboardingFieldErrors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async () => {
    if (pending) return;
    const input = {
      displayName,
      unitPref,
      weekStart,
      defaultRestSeconds: restSeconds,
      trainingGoal: goal.trim().length > 0 ? goal.trim() : null,
    };
    const v = validateOnboardingInput(input);
    setErrs(v);
    if (hasOnboardingErrors(v)) return;
    setBanner(null);
    setPending(true);
    try {
      await submit(input);
      // runtime transitions to `ready`; the root layout redirects to (tabs).
    } catch {
      setPending(false);
      setBanner('Could not save your profile. It’s stored on this device — try again.');
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingVertical: t.spacing.xl, gap: t.spacing.lg }}>
        <AppText token="title1">Set up your profile</AppText>
        <AppText color="textMuted">
          {user ? 'A few basics so the app works in your units and week.' : 'A few basics to get started.'}
        </AppText>
        {banner ? <FormBanner variant="error" message={banner} /> : null}

        <AppTextField
          label="Display name"
          value={displayName}
          onChangeText={setDisplayName}
          error={errs.displayName}
          autoCapitalize="words"
          autoComplete="name"
        />
        <SegmentedControl
          label="Preferred unit"
          options={UNITS}
          value={unitPref}
          onChange={setUnitPref}
        />
        <SegmentedControl
          label="Week starts on"
          options={WEEK_DAYS}
          value={weekStart}
          onChange={setWeekStart}
        />
        <NumberStepper
          label="Default rest timer"
          value={restSeconds}
          onChange={setRestSeconds}
          min={0}
          max={900}
          step={15}
          suffix="sec"
          error={errs.defaultRestSeconds}
        />
        <AppTextField
          label="Training goal (optional)"
          value={goal}
          onChangeText={setGoal}
          error={errs.trainingGoal}
          multiline
          placeholder="e.g. add 10 kg to my squat this block"
        />

        <View style={{ height: t.spacing.md }} />
        <PrimaryButton
          label={pending ? 'Saving…' : 'Continue'}
          loading={pending}
          disabled={displayName.trim().length === 0}
          onPress={onSubmit}
        />
      </ScrollView>
    </Screen>
  );
}
