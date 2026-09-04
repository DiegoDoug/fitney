# Physical-device runbook — WORK-007 / WORK-010 (Phase 5, increment 3)

Owner: `client-engineering` + `quality-engineering`. Executor: a human with a physical
iOS or Android phone (fastest: Expo Go, no install beyond the app) or access to an
iOS Simulator / Android Studio emulator host. This runbook cannot be executed by
Claude Code in this environment — no simulator, emulator, or device is reachable
(verified: no `adb`, no Android emulator, no `xcrun`).

**Explicitly OUT of this runbook's scope:** the full hosted authentication/recovery
flow (real GoTrue email delivery, confirmation links, password-recovery deep links)
stays open — see §14.18's hosted-auth table. This runbook exercises the
already-implemented client logic (session, offline logging, sign-out, retained
accounts) on a real device/runtime; it does not require or exercise real email
delivery. A `devUserId` (dev-only local-fake-session bypass, see `context.tsx`'s
`RuntimeProviderProps.devUserId`) may be used to reach a signed-in state without a
real GoTrue round trip for the parts of this runbook that don't specifically test
auth itself — but at least one full real sign-up/sign-in pass (Section 0) should
also be attempted opportunistically if a working hosted `.env` is available.

## Setup

1. `cd client && npm install` (fresh clone) or confirm `node_modules` is current.
2. Populate `client/.env` with `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   for `fitney-dev` (client-safe values — see `client/.env.example`; get them from the
   Supabase dashboard → Project Settings → API, or ask Claude Code to fetch them via
   the connected Supabase MCP in a future session).
3. `npx expo start` from `client/`.
4. iOS: install **Expo Go** from the App Store, scan the terminal QR with the Camera
   app. Android: install **Expo Go** from Play Store, scan the QR from within the
   Expo Go app.
5. Confirm the app boots to the sign-in/welcome screen with no red-box error.

## Evidence to capture throughout

For every section below: a screen recording or timestamped screenshots of each named
step, plus the Metro/terminal log window visible (or copied) for the same window —
attach both to the increment-3 verification report. Note exact device model + OS
version + Expo Go version at the top of the capture.

---

## 0. Real authentication round trip (WORK-007 baseline)

1. From Welcome, tap **Sign up**. Use a real-inbox email you control (not
   `@example.com` — hosted GoTrue rejects that domain, see §14.18) and a compliant
   password (≥8 chars, upper+lower+digit).
2. **Expected:** either an immediate signed-in state, or an explicit "check your
   email" state — capture which one actually happens (this is the still-unverified
   `enable_confirmations` question from §14.18).
3. If a confirmation email arrives, tap its link on the SAME device. **Expected:**
   the app opens via the `fitney://auth/callback` deep link and lands signed-in.
   Capture whether this succeeds or errors (the still-unverified redirect
   allow-list question from §14.18).
4. Sign out cleanly (Settings → Sign out, nothing outstanding). Sign back in with
   the same credentials. **Expected:** lands on the onboarding screen (first
   sign-in) or Today (already onboarded).
5. From Sign-in, tap **Forgot password**, submit the same email. Capture whether a
   recovery email arrives and whether its link deep-links correctly into the reset
   screen.

## 1. Offline logging (WORK-007)

1. Sign in (or use `devUserId`). Start a workout from Today (empty session).
2. Turn on **Airplane Mode** on the device.
3. Add 3+ exercises, log several sets each (varying load/reps), mark some sets
   complete. **Expected:** every action completes locally with no spinner-forever
   or error state; the UI never blocks on connectivity.
4. Finish the session while still offline. **Expected:** completes locally,
   Today reflects the finished session.
5. Turn Airplane Mode back off. **Expected:** within a few seconds the app
   syncs (no user action needed) and any "unsynced" indicator clears.

## 2. Force-close recovery (WORK-007)

1. While mid-workout (an active, unfinished session with a couple of logged sets),
   force-quit the app (iOS: swipe up from app switcher; Android: swipe away from
   recents).
2. Relaunch via the home-screen icon (not Expo Go's dev menu — a real cold start).
3. **Expected:** lands back on the SAME active session with all previously logged
   sets intact; no data loss, no duplicate session created.
4. Repeat step 1-3 but force-quit DURING an active rest timer. **Expected:** the
   rest timer's remaining time is reasonably reconstructed (anchor-based, not
   naively resumed from a frozen countdown) after relaunch.

## 3. Sign-out choices (WORK-007 — exercises `SignOutController` + the Settings UI)

Do each of these as SEPARATE passes (sign back in between):

1. **Clean sign-out:** with no unsynced changes (freshly synced), Settings →
   Sign out. **Expected:** immediate sign-out, no choice sheet appears.
2. **Dirty sign-out — Back up & sign out:** go offline, log a set, come back online
   but immediately go to Settings → Sign out before auto-sync completes.
   **Expected:** the choice sheet appears naming the account and change count;
   tap **Back up & sign out**; if online, it completes the sync then signs out;
   confirm on next sign-in that the change is present (was not lost).
3. **Dirty sign-out — Keep on this device:** repeat with an offline dirty change,
   choose **Keep on this device & sign out**. **Expected:** signs out immediately,
   the account becomes "Retained on this device" in Settings after signing in as
   a DIFFERENT account (see Section 4).
4. **Dirty sign-out — Discard:** repeat with an offline dirty change, choose
   **Discard N changes & sign out**, confirm the explicit loss warning, confirm
   again. **Expected:** the second confirm names the exact change count before
   discarding; after sign-out the change is genuinely gone (not resurrected on
   next sign-in).
5. **Cancel:** open the choice sheet (dirty state), tap **Cancel**. **Expected:**
   returns to normal app use, the session stays signed in, and the dirty change
   is still there / still syncs normally afterward (confirm by going back online
   and checking the change reaches Today's history).
6. **Backup failure/offline:** go offline, create a dirty change, Settings →
   Sign out → **Back up & sign out** WHILE STILL OFFLINE. **Expected:** the
   attempt fails to drain (no network), the sheet re-appears with the residual
   count instead of silently signing out; the app remains fully usable (log
   another set) — this exercises the exact freeze-restore behavior from the
   DEC-53 correction pass (§14.15) on a real device for the first time.

## 4. Retained-account discovery, multiple accounts, removal (WORK-007 — CE-R5 v2)

1. Starting fresh (or after Section 3.3's "Keep on this device"), sign in as a
   SECOND account (a different email) on the same device/app install.
2. Go to Settings. **Expected:** a "Retained on this device" card lists the FIRST
   account (not the currently-active second one), with a **Remove account from
   this device** button.
3. Repeat: sign out of account 2 with unsynced work, choosing **Keep on this
   device**, then sign in as a THIRD account. **Expected:** BOTH account 1 and
   account 2 now appear as separate retained entries — confirms the multi-account
   fix (was previously a single-slot marker that would have shown only the most
   recent one).
4. **Restart discovery:** force-quit the app entirely, relaunch, sign in as
   account 3 again (or stay signed out). **Expected:** the retained accounts from
   steps 2-3 STILL appear in Settings after the cold restart — confirms discovery
   is disk-based (`expo-file-system` directory listing at boot), not just
   in-memory session state that a restart would have lost.
5. Tap **Remove account from this device** for one retained account. **Expected:**
   a confirmation naming the exact unsynced-change count (or "unknown — any
   unsynced changes will be lost" if the file can't be read), then a second
   destructive confirm; after confirming, that account disappears from the list
   and — if you sign back into it — it behaves like a brand-new local install
   (no local history), while the SERVER's data for that account is untouched
   (sign in and confirm the server-synced history is still there via a normal
   sync).
6. **Active-account protection:** while signed in as account 3, confirm there is
   NO "Remove account from this device" option shown for account 3 itself (only
   for the OTHER retained accounts) — the active account can never be removed
   without signing out of it first.
7. **Re-authentication reactivates, does not delete:** sign back into one of the
   still-retained accounts from step 3. **Expected:** its previously-logged
   offline data (from whenever it was signed out) is still there, and it now
   drains any outstanding sync normally; it no longer appears in the "Retained on
   this device" list (it's the active account now).

## Reporting

For each numbered step above, record: PASS / FAIL / BLOCKED (with what blocked it)
and attach the corresponding evidence. Do not mark WORK-007 or WORK-010 as
verified from a partial run — report exactly which sections were completed.
