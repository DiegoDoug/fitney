import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen, AppText, PrimaryButton, AppTextField, FormBanner } from '@/components/ui';
import { useTheme } from '@/design-system/theme';
import { useAuth } from '@/runtime/context';
import { validateEmail } from '@/services/auth';

/**
 * Request a password-reset link (SPEC AUTH-01). The confirmation copy is uniform
 * whether or not the address has an account (SEC-REQ-AUTH-03) — only a transport
 * failure produces an error state.
 */
export default function ForgotPasswordScreen() {
  const t = useTheme();
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [err, setErr] = useState<string | undefined>(undefined);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const submit = async () => {
    if (pending) return;
    const e = validateEmail(email);
    setErr(e ?? undefined);
    if (e) return;
    setBanner(null);
    setPending(true);
    const res = await sendPasswordReset(email);
    setPending(false);
    if (res.ok) setSent(true);
    else setBanner(res.message);
  };

  if (sent) {
    return (
      <Screen>
        <View style={{ flex: 1, justifyContent: 'center', gap: t.spacing.lg }}>
          <AppText token="title1">Check your email</AppText>
          <FormBanner
            variant="info"
            message="If that address has an account, we’ve sent a link to reset the password."
          />
          <PrimaryButton label="Back to sign in" onPress={() => router.replace('/(auth)/sign-in')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', gap: t.spacing.lg }}>
        <AppText token="title1">Reset password</AppText>
        <AppText color="textMuted">Enter your email and we’ll send a reset link.</AppText>
        {banner ? <FormBanner variant="error" message={banner} /> : null}
        <AppTextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          error={err}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
          onSubmitEditing={submit}
          returnKeyType="go"
        />
        <PrimaryButton
          label={pending ? 'Sending…' : 'Send reset link'}
          loading={pending}
          disabled={email.length === 0}
          onPress={submit}
        />
        <AppText token="label" color="accent" onPress={() => router.back()}>
          Back
        </AppText>
      </View>
    </Screen>
  );
}
