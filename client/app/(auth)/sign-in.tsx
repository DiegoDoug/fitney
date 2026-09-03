import { useState } from 'react';
import { View } from 'react-native';
import { Screen, AppText, PrimaryButton } from '@/components/ui';
import { useTheme } from '@/design-system/theme';

/**
 * Sign in (SPEC §6.1 AUTH-01). Email/password only for MVP. The Supabase Auth
 * wiring (services/AuthProvider -> userId -> RuntimeProvider) lands with the auth
 * slice; this pass ships the screen shell + validation states so the (auth)
 * group is navigable and the layered seam is in place (ADR-0009).
 */
export default function SignInScreen() {
  const t = useTheme();
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', gap: t.spacing.lg }}>
        <AppText token="display">Fitney</AppText>
        <AppText color="textMuted">
          Email / password sign-in is wired to Supabase Auth in the auth slice. Secrets are stored in the
          OS keychain (expo-secure-store), never in the local database.
        </AppText>
        <PrimaryButton
          label={pending ? 'Signing in…' : 'Continue'}
          loading={pending}
          disabled={email.length === 0}
          onPress={() => setPending(true)}
        />
      </View>
    </Screen>
  );
}
