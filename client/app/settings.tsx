import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen, AppText, AppSurface, PrimaryButton, FormBanner } from '@/components/ui';
import { useTheme } from '@/design-system/theme';
import { useAuth, useRuntime } from '@/runtime/context';

/**
 * Minimal settings (SPEC §4.2). This increment ships only the account section —
 * sign out. Units / theme / plate increment / export / delete-account arrive in
 * their own increments. Sign-out drops the local DB when everything is synced;
 * when unsynced work exists the DB is RETAINED (nothing is discarded) and a
 * notice is shown (interim policy — routed for owner ratification).
 */
export default function SettingsScreen() {
  const t = useTheme();
  const rt = useRuntime();
  const { signOut, unsyncedNotice } = useAuth();
  const [pending, setPending] = useState(false);

  const onSignOut = async () => {
    if (pending) return;
    setPending(true);
    await signOut();
    setPending(false);
    // the runtime transitions to signed-out; the root layout redirects.
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
            message="Your last sign-out kept unsynced changes on this device. Sign back in with that account to finish syncing."
          />
        ) : null}

        <AppSurface>
          <AppText token="caption" color="textMuted">
            ACCOUNT
          </AppText>
          <AppText token="body">{rt.status === 'ready' ? `Signed in · ${rt.userId.slice(0, 8)}…` : 'Signed in'}</AppText>
          <View style={{ height: t.spacing.md }} />
          <PrimaryButton
            label={pending ? 'Signing out…' : 'Sign out'}
            variant="secondary"
            loading={pending}
            onPress={onSignOut}
          />
        </AppSurface>
      </View>
    </Screen>
  );
}
