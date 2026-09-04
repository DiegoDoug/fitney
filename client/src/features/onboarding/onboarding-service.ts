/**
 * Onboarding (SPEC AUTH-03) — the first-run flow for a freshly authenticated
 * user. It asks ONLY for: display name, preferred unit, week start day, default
 * rest timer, and an optional training goal. Nothing else (no scope creep).
 *
 * Contract:
 *   - the profile is created / hydrated through the EXISTING server contract:
 *     `ProfileRepository.upsert` writes the local `profiles` row and enqueues a
 *     `profile` upsert on the outbox, atomically. `sync_apply` then persists it
 *     server-side under RLS (`profile_insert with check (id = auth.uid())`) — the
 *     client owns first-write of its own profile row (there is no server signup
 *     trigger).
 *   - completion is idempotent: re-submitting coalesces the outbox entry and the
 *     local marker is set-once.
 *   - interrupted onboarding is resumable: a partial `profiles` row prefills the
 *     form (`getState().draft`).
 *   - a user who already onboarded on another device is detected via the pulled,
 *     server-synced profile row — the form is skipped.
 */
import type { Profile, UnitPref } from '@/domain/entities';
import type { Uuid } from '@/domain/ids';
import type { Clock } from '@/services/clock';
import type { Analytics } from '@/services/analytics';
import type { Logger } from '@/services/logger';
import type { OnboardingState, ProfileRepository } from '@/data/repositories/types';

export type OnboardingInput = {
  displayName: string;
  unitPref: UnitPref;
  weekStart: number; // 0=Sun .. 6=Sat
  defaultRestSeconds: number;
  trainingGoal: string | null;
};

export type OnboardingDraft = NonNullable<OnboardingState['draft']>;

export type OnboardingFieldErrors = Partial<
  Record<'displayName' | 'unitPref' | 'weekStart' | 'defaultRestSeconds' | 'trainingGoal', string>
>;

export const MAX_DISPLAY_NAME = 80;
export const MAX_TRAINING_GOAL = 200;
export const MAX_REST_SECONDS = 900; // 15 min ceiling — a timer, not a stopwatch

/** Pure — the screen calls this on every change for inline validation. */
export function validateOnboardingInput(input: Partial<OnboardingInput>): OnboardingFieldErrors {
  const errs: OnboardingFieldErrors = {};
  const name = (input.displayName ?? '').trim();
  if (name.length === 0) errs.displayName = 'Enter a display name.';
  else if (name.length > MAX_DISPLAY_NAME) errs.displayName = `Keep it under ${MAX_DISPLAY_NAME} characters.`;

  if (input.unitPref !== 'kg' && input.unitPref !== 'lb') errs.unitPref = 'Choose a unit.';

  const ws = input.weekStart;
  if (ws == null || !Number.isInteger(ws) || ws < 0 || ws > 6) errs.weekStart = 'Choose a week start day.';

  const rest = input.defaultRestSeconds;
  if (rest == null || !Number.isInteger(rest) || rest < 0) errs.defaultRestSeconds = 'Enter a rest time in seconds.';
  else if (rest > MAX_REST_SECONDS) errs.defaultRestSeconds = `Keep it under ${MAX_REST_SECONDS} seconds.`;

  const goal = input.trainingGoal ?? '';
  if (goal.length > MAX_TRAINING_GOAL) errs.trainingGoal = `Keep it under ${MAX_TRAINING_GOAL} characters.`;

  return errs;
}

export function hasOnboardingErrors(errs: OnboardingFieldErrors): boolean {
  return Object.keys(errs).length > 0;
}

export type OnboardingView =
  | { status: 'complete' }
  | { status: 'needed'; draft: OnboardingDraft | null };

export class OnboardingService {
  constructor(
    private readonly repos: Pick<Repos, 'profile'>,
    private readonly svc: { clock: Clock; analytics: Analytics; logger: Logger },
  ) {}

  /** Is onboarding still required for this user on this device? */
  async getState(userId: Uuid): Promise<OnboardingView> {
    const s = await this.repos.profile.getOnboardingState(userId);
    if (s.completed) return { status: 'complete' };
    return { status: 'needed', draft: s.draft };
  }

  /**
   * Persist the profile (local row + outbox) and mark onboarding done. Safe to
   * call repeatedly — the outbox coalesces and the marker is set-once.
   */
  async submit(userId: Uuid, input: OnboardingInput): Promise<Profile> {
    const errs = validateOnboardingInput(input);
    if (hasOnboardingErrors(errs)) {
      throw new OnboardingValidationError(errs);
    }

    const now = this.svc.clock.now();
    const existing = await this.repos.profile.get(userId);
    const goal = (input.trainingGoal ?? '').trim();

    const profile: Profile = {
      id: userId,
      user_id: userId,
      display_name: input.displayName.trim(),
      unit_pref: input.unitPref,
      week_start: input.weekStart,
      default_rest_seconds: input.defaultRestSeconds,
      training_goal: goal.length > 0 ? goal : null,
      // fields NOT asked during onboarding — keep any existing value, else default
      haptics: existing?.haptics ?? true,
      sound: existing?.sound ?? true,
      theme: existing?.theme ?? 'system',
      plate_increment_kg: existing?.plate_increment_kg ?? 2.5,
      // sync meta — a never-synced local insert (base_version 0 -> server version 1)
      version: existing?.version ?? 1,
      updated_at: existing?.updated_at ?? null,
      created_at: existing?.created_at ?? null,
      deleted_at: null,
      synced_version: existing?.synced_version ?? null,
      dirty: 1,
      local_updated_at: now,
    };

    await this.repos.profile.upsert(userId, profile);
    await this.repos.profile.markOnboardingComplete(userId, now);
    this.svc.analytics.track({ name: 'onboarding_completed' });
    this.svc.logger.log('info', 'onboarding.completed', { userIdHash: hash8(userId) });
    return profile;
  }
}

export class OnboardingValidationError extends Error {
  readonly fields: OnboardingFieldErrors;
  constructor(fields: OnboardingFieldErrors) {
    super('onboarding validation failed');
    this.name = 'OnboardingValidationError';
    this.fields = fields;
  }
}

// local structural alias so this file doesn't import the whole Repositories type
type Repos = { profile: ProfileRepository };

/** short non-reversible tag for logs — never the raw id (CON-9). */
function hash8(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16).padStart(8, '0');
}
