import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen, AppText, AppSurface, PrimaryButton, FormBanner } from '@/components/ui';
import { useTheme } from '@/design-system/theme';
import { useAuth, useRuntime } from '@/runtime/context';

/**
 * Minimal settings (SPEC §4.2). Account section only this increment.
 *
 * Sign-out (CE-R5 v2 / DEC-53): nothing outstanding → sign out + drop the
 * per-user DB (ADR-0009). Outstanding work → a destructive-action sheet
 * (Back up / Keep on this device / Discard + confirm / Cancel). Opening the
 * sheet does NOT freeze local writes; only "Back up & sign out" does, and a
 * failed backup or Cancel restores them. Nothing is discarded without an
 * explicit informed confirm and there is no time-based deletion (FR-SYNC-04).
 *
 * "Remove account from this device" appears for a RETAINED (previously
 * signed-out / kept) account and permanently deletes its local DB after an
 * explicit loss confirmation.
 */
export default function SettingsScreen() {
  const t = useTheme();
  const rt = useRuntime();
  const {
    signOut,
    unsyncedNotice,
    signOutPrompt,
    resolveSignOutPrompt,
    retainedAccounts,
    retainedAccountOutstanding,
    removeAccountFromDevice,
  } = useAuth();
  const [pending, setPending] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  // keyed by userId — each retained account gets its own confirm step
  const [removeState, setRemoveState] = useState<
    Record<string, { outstanding: { outbox: number; openConflicts: number } | null } | undefined>
  >({});

  useEffect(() => {
    // drop confirm state for any account that is no longer retained (removed,
    // or reactivated by re-authenticating)
    setRemoveState((prev) => {
      const next: typeof prev = {};
      for (const id of retainedAccounts) if (prev[id]) next[id] = prev[id];
      return next;
    });
  }, [retainedAccounts]);

  const onSignOut = async () => {
    if (pending) return;
    setPending(true);
    await signOut();
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

  const openRemoveConfirm = async (userId: string) => {
    if (pending) return;
    setPending(true);
    const outstanding = await retainedAccountOutstanding(userId).catch(() => null);
    setPending(false);
    setRemoveState((prev) => ({ ...prev, [userId]: { outstanding } }));
  };
  const cancelRemoveConfirm = (userId: string) => {
    setRemoveState((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  };
  const doRemove = async (userId: string) => {
    if (pending) return;
    setPending(true);
    await removeAccountFromDevice(userId).catch(() => {});
    setPending(false);
    cancelRemoveConfirm(userId);
  };

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
                <PrimaryButton label="Cancel" variant="secondary" disabled={pending} onPress={() => resolve('cancel')} />
              </View>
            ) : (
              <View style={{ gap: t.spacing.sm }}>
                <FormBanner
                  variant="error"
                  message={`Permanently delete ${n} unsynced change${n === 1 ? '' : 's'} from this device? This can't be undone.`}
                />
                <PrimaryButton label="Delete & sign out" variant="destructive" loading={pending} onPress={() => resolve('discard')} />
                <PrimaryButton label="Back" variant="secondary" disabled={pending} onPress={() => setConfirmDiscard(false)} />
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

        {retainedAccounts.length > 0 ? (
          <AppSurface role="raised-1" style={{ borderColor: t.colors.borderStrong, borderWidth: 1 }}>
            <AppText token="caption" color="textMuted">
              RETAINED ON THIS DEVICE
            </AppText>
            {retainedAccounts.map((userId) => {
              const confirming = removeState[userId];
              const removeN = confirming?.outstanding
                ? confirming.outstanding.outbox + confirming.outstanding.openConflicts
                : null;
              return (
                <View key={userId} style={{ gap: t.spacing.sm, paddingTop: t.spacing.sm }}>
                  <AppText token="body">{`${userId.slice(0, 8)}… — local data kept`}</AppText>
                  {!confirming ? (
                    <PrimaryButton
                      label={pending ? 'Checking…' : 'Remove account from this device'}
                      variant="secondary"
                      loading={pending}
                      onPress={() => openRemoveConfirm(userId)}
                    />
                  ) : (
                    <View style={{ gap: t.spacing.sm }}>
                      <FormBanner
                        variant="error"
                        message={
                          removeN != null
                            ? `Permanently delete this device's local data for that account, including ${removeN} unsynced change${removeN === 1 ? '' : 's'}? This can't be undone.`
                            : `Permanently delete this device's local data for that account, including any unsynced changes? This can't be undone.`
                        }
                      />
                      <PrimaryButton
                        label="Delete local data"
                        variant="destructive"
                        loading={pending}
                        onPress={() => doRemove(userId)}
                      />
                      <PrimaryButton
                        label="Back"
                        variant="secondary"
                        disabled={pending}
                        onPress={() => cancelRemoveConfirm(userId)}
                      />
                    </View>
                  )}
                </View>
              );
            })}
          </AppSurface>
        ) : null}
      </View>
    </Screen>
  );
}
