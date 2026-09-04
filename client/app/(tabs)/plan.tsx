import { Screen, AppText, AppSurface } from '@/components/ui';

/**
 * Plan (SPEC §7.3, UX-DEC-05) — week strip + selected-day detail. Weekly
 * planning is the primary planning model (DEC-004). Full editor + copy-previous-
 * week land in the Weekly-planning increment (SPEC §18 Phase 2); this pass ships
 * the shell + empty state so the tab is navigable.
 */
export default function PlanScreen() {
  return (
    <Screen>
      <AppText token="title1">Plan</AppText>
      <AppSurface style={{ marginTop: 16 }}>
        <AppText token="heading">Weekly planning</AppText>
        <AppText color="textMuted">
          Copy previous week, use a template, or add a workout. (Editor arrives in the planning increment.)
        </AppText>
      </AppSurface>
    </Screen>
  );
}
