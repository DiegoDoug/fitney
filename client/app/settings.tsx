import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen, AppText, AppSurface, PrimaryButton, FormBanner } from '@/components/ui';
import { useTheme } from '@/design-system/theme';
import { useAuth, useRuntime } from '@/runtime/context';

/**
 * Minimal settings (SPEC §4.2). This increment ships only the account section —
 * sign out. Units / theme / plate increment / export / delete-account arrive in
 * their own increments.
 *
 * Sign-out (CE-R5 v2 / DEC-53): with nothing outstanding, sign out and drop the
 * per-user DB (ADR-0009). With outstanding local work, sign-out is a destructive
 * action — a choice sheet (Back up / Keep on this device / Discard / Cancel);
 * nothing is discarded without an explicit informed confirm, and there is no
 * time-based deletion of unsynced work (FR-SYNC-04). Cancel restores normal
 * writes and stays signed in.
 */
export default function SettingsScreen() {
  const t = useTheme();
  const rt = useRuntime();
  const { signOut, unsyncedNotice, signOutPrompt, resolveSignOutPrompt } = useAuth();
  const [pending, setPending] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const onSignOut = async () => {
    if (pending) return;
    setPending(true);
    await signOut(); // opens `signOutPrompt` if there is outstanding work
    setPending(false);
  };

  const resolve = async (choice: 'backup' | 'keep' | 'discard' | 'cancel') => {
    if (pending) return;
    setPending(true);
    await resolveSignOutPrompt(choice);
    setPending(false);
    setConfirmDiscard(false);
  };

  const n = signOutPrompt ? signOutPrompt.outbox + signOutPrompt.openConflicts : 0;

  return (
    <Screen>
      <View style={{ paddingVertical: t.spacing.lg, gap: t.spacing.lg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText token="title1">Settings</AppText>
          <AppText token="label" color="accent" onPress={() => router.back()}>
            Done
          </AppText>
        </View>

        {unsyncedNotice ? (
          <FormBanner
            variant="info"
            message="A previous session ended with unsynced changes kept on this device. Sign back in with that account to finish syncing."
          />
        ) : null}

        {signOutPrompt ? (
          <AppSurface role="raised-1" style={{ borderColor: t.colors.borderStrong, borderWidth: 1 }}>
            <AppText token="heading">Sign out of this account?</AppText>
            <AppText color="textMuted">
              {n} change{n === 1 ? '' : 's'} {n === 1 ? 'is' : 'are'} saved on this device but not backed up yet.
            </AppText>
            <View style={{ height: t.spacing.md }} />
            {!confirmDiscard ? (
              <View style={{ gap: t.spacing.sm }}>
                <PrimaryButton label="Back up & sign out" loading={pending} onPress={() => resolve('backup')} />
                <PrimaryButton
                  label="Keep on this device & sign out"
                  variant="secondary"
                  disabled={pending}
                  onPress={() => resolve('keep')}
                />
                <PrimaryButton
                  label={`Discard ${n} change${n === 1 ? '' : 's'} & sign out`}
                  variant="destructive"
                  disabled={pending}
                  onPress={() => setConfirmDiscard(true)}
                />
                <PrimaryButton
                  label="Cancel"
                  variant="secondary"
                  disabled={pending}
                  onPress={() => resolve('cancel')}
                />
              </View>
            ) : (
              <View style={{ gap: t.spacing.sm }}>
                <FormBanner
                  variant="error"
                  message={`Permanently delete ${n} unsynced change${n === 1 ? '' : 's'} from this device? This can't be undone.`}
                />
                <PrimaryButton
                  label="Delete & sign out"
                  variant="destructive"
                  loading={pending}
                  onPress={() => resolve('discard')}
                />
                <PrimaryButton
                  label="Back"
                  variant="secondary"
                  disabled={pending}
                  onPress={() => setConfirmDiscard(false)}
                />
              </View>
            )}
          </AppSurface>
        ) : (
          <AppSurface>
            <AppText token="caption" color="textMuted">
              ACCOUNT
            </AppText>
            <AppText token="body">
              {rt.status === 'ready' ? `Signed in · ${rt.userId.slice(0, 8)}…` : 'Signed in'}
            </AppText>
            <View style={{ height: t.spacing.md }} />
            <PrimaryButton
              label={pending ? 'Signing out…' : 'Sign out'}
              variant="secondary"
              loading={pending}
              onPress={onSignOut}
            />
          </AppSurface>
        )}
      </View>
    </Screen>
  );
}
