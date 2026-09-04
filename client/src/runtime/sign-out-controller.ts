/**
 * Sign-out orchestration (CE-R5 v2 / DEC-53). The production state machine that
 * `context.tsx` delegates to — extracted so it is unit-testable without React.
 *
 * Freeze discipline (human review 2026-09-04):
 *   - Opening the choice sheet MUST NOT start the backup-attempt freeze. `begin()`
 *     freezes only momentarily to read `outstandingWork()` race-free, then
 *     unfreezes before it prompts.
 *   - A failed / incomplete backup and Cancel MUST restore normal writes for the
 *     still-active account.
 *   - The write barrier IS preserved from a successful final verification through
 *     provider sign-out and teardown (no unfreeze on the clean paths).
 *   - A superseded in-flight attempt (Cancel mid-backup, an account switch, a
 *     signed-out-elsewhere) NEVER signs out, drops a DB, or clears credentials —
 *     guarded by a monotonic `attempt` counter + the host generation.
 */
import type { AppContainer } from './build-container';
import type { SignOutCause, SignOutChoice } from './account-lifecycle';

export type OutstandingWork = { outbox: number; openConflicts: number };

export type SignOutHost = {
  /** the currently-active container, or null */
  container(): AppContainer | null;
  /**
   * Set the retire intent (cause/choice), call the auth provider sign-out, and
   * ensure the SIGNED_OUT retire runs (drop vs retain per cause+choice). Resolves
   * once the provider call returns; the retire itself is queued on the runtime's
   * serialized transition chain.
   */
  signOutWith(cause: SignOutCause, choice?: SignOutChoice): Promise<void>;
  /** open the dirty-sign-out sheet with a count, or close it with null */
  setPrompt(p: OutstandingWork | null): void;
  /** monotonic runtime generation — bumped on every account transition */
  generation(): number;
};

export type BeginResult = 'signed-out' | 'prompt' | 'no-session';
export type ResolveResult = 'signed-out' | 'reprompt' | 'cancelled' | 'stale';
export type ResolveChoice = 'backup' | 'keep' | 'discard' | 'cancel';

const isClean = (w: OutstandingWork): boolean => w.outbox === 0 && w.openConflicts === 0;

export class SignOutController {
  /** bumped by every begin()/resolve() call; an in-flight attempt whose id no
   *  longer matches has been superseded and must not act. */
  private attempt = 0;

  constructor(private readonly host: SignOutHost) {}

  /** the user tapped "Sign out". */
  async begin(): Promise<BeginResult> {
    const c = this.host.container();
    const my = ++this.attempt;
    const gen = this.host.generation();
    if (!c) {
      await this.host.signOutWith('user_initiated');
      return 'no-session';
    }

    c.setWritesFrozen(true); // momentary — a race-free check, NOT the backup freeze
    let work: OutstandingWork;
    try {
      work = await c.outstandingWork();
    } catch {
      c.setWritesFrozen(false);
      return 'no-session';
    }
    if (this.superseded(my, gen, c)) {
      if (my === this.attempt) c.setWritesFrozen(false);
      return 'no-session';
    }

    if (isClean(work)) {
      // clean — STAY frozen through provider sign-out + teardown (barrier preserved)
      await this.host.signOutWith('user_initiated');
      return 'signed-out';
    }
    // dirty — the sheet opens UNFROZEN; the account stays fully usable
    c.setWritesFrozen(false);
    this.host.setPrompt(work);
    return 'prompt';
  }

  /** the user resolved the dirty-sign-out sheet. */
  async resolve(choice: ResolveChoice): Promise<ResolveResult> {
    const c = this.host.container();
    const my = ++this.attempt; // supersedes any in-flight begin()/resolve() (incl. a running backup)
    if (!c) {
      this.host.setPrompt(null);
      return 'cancelled';
    }

    if (choice === 'cancel') {
      c.setWritesFrozen(false); // restore writes + local-change scheduling
      this.host.setPrompt(null);
      return 'cancelled';
    }

    if (choice === 'keep' || choice === 'discard') {
      c.setWritesFrozen(false);
      this.host.setPrompt(null);
      await this.host.signOutWith('user_initiated', choice as SignOutChoice);
      return 'signed-out';
    }

    // choice === 'backup'
    const gen = this.host.generation();
    c.setWritesFrozen(true);
    try {
      await c.sync.requestSync('manual');
    } catch {
      /* transport error / partial drain — fall through to the re-check */
    }
    if (this.superseded(my, gen, c)) {
      if (my === this.attempt) c.setWritesFrozen(false);
      return 'stale';
    }

    let work2: OutstandingWork;
    try {
      work2 = await c.outstandingWork();
    } catch {
      c.setWritesFrozen(false);
      return 'stale';
    }
    if (this.superseded(my, gen, c)) {
      if (my === this.attempt) c.setWritesFrozen(false);
      return 'stale';
    }

    if (isClean(work2)) {
      // final verification passed — STAY frozen through provider sign-out + teardown
      this.host.setPrompt(null);
      await this.host.signOutWith('user_initiated');
      return 'signed-out';
    }
    // failed / incomplete backup — RESTORE writes, re-prompt with the residual count
    c.setWritesFrozen(false);
    this.host.setPrompt(work2);
    return 'reprompt';
  }

  private superseded(my: number, gen: number, c: AppContainer): boolean {
    return my !== this.attempt || gen !== this.host.generation() || this.host.container() !== c;
  }
}
