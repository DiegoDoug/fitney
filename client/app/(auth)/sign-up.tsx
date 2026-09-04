import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import {
  Screen,
  AppText,
  PrimaryButton,
  AppTextField,
  FormBanner,
} from '@/components/ui';
import { useTheme } from '@/design-system/theme';
import { useAuth } from '@/runtime/context';
import { validateSignUpForm, hasErrors, MIN_PASSWORD_LENGTH, type FieldErrors } from '@/services/auth';

/**
 * Create account (SPEC AUTH-01). States: idle, validating, submitting,
 * failure (neutral banner — an already-registered email shows the SAME
 * "check your email" copy as success, so the screen never confirms account
 * existence, SEC-REQ-AUTH-03), confirm-email (when the hosted flow requires it),
 * success+signed-in (runtime transitions to onboarding).
 */
export default function SignUpScreen() {
  const t = useTheme();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errs, setErrs] = useState<FieldErrors>({});
  const [banner, setBanner] = useState<{ variant: 'error' | 'success'; message: string } | null>(null);
  const [pending, setPending] = useState(false);
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);

  const submit = async () => {
    if (pending) return;
    const v = validateSignUpForm(email, password, confirm);
    setErrs(v);
    if (hasErrors(v)) return;
    setBanner(null);
    setPending(true);
    const res = await signUp(email, password, confirm);
    setPending(false);
    if (!res.ok) {
      setBanner({ variant: 'error', message: res.message });
      return;
    }
    if (res.needsEmailConfirmation) {
      setAwaitingConfirm(true);
      setBanner({ variant: 'success', message: 'Check your email to confirm your address, then sign in.' });
    }
    // if signedIn, the runtime transitions to onboarding and this unmounts.
  };

  if (awaitingConfirm) {
    return (
      <Screen>
        <View style={{ flex: 1, justifyContent: 'center', gap: t.spacing.lg }}>
          <AppText token="title1">Almost there</AppText>
          <FormBanner variant="info" message="We sent a confirmation link to your email. Open it, then sign in." />
          <PrimaryButton label="Go to sign in" onPress={() => router.replace('/(auth)/sign-in')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', gap: t.spacing.lg }}>
        <AppText token="title1">Create account</AppText>
        {banner ? <FormBanner variant={banner.variant} message={banner.message} /> : null}
        <AppTextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          error={errs.email}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="username"
          keyboardType="email-address"
        />
        <AppTextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          error={errs.password}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
        />
        <AppTextField
          label="Confirm password"
          value={confirm}
          onChangeText={setConfirm}
          error={errs.confirm}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          onSubmitEditing={submit}
          returnKeyType="go"
        />
        <PrimaryButton
          label={pending ? 'Creating…' : 'Create account'}
          loading={pending}
          disabled={!email || !password || !confirm}
          onPress={submit}
        />
        <AppText token="label" color="accent" onPress={() => router.replace('/(auth)/sign-in')}>
          I already have an account
        </AppText>
      </View>
    </Screen>
  );
}
