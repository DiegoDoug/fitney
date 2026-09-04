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
import { validateSignInForm, hasErrors, type FieldErrors } from '@/services/auth';

/**
 * Sign in (SPEC AUTH-01). Email/password only. States: idle, validating,
 * submitting (spinner + disabled), failure (banner + neutral copy, no
 * enumeration), success (the auth event drives navigation — the root layout
 * redirects to the app shell or onboarding).
 */
export default function SignInScreen() {
  const t = useTheme();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errs, setErrs] = useState<FieldErrors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async () => {
    if (pending) return;
    const v = validateSignInForm(email, password);
    setErrs(v);
    if (hasErrors(v)) return;
    setBanner(null);
    setPending(true);
    const res = await signIn(email, password);
    setPending(false);
    if (!res.ok) setBanner(res.message);
    // on success the runtime transitions; this screen unmounts.
  };

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', gap: t.spacing.lg }}>
        <AppText token="title1">Sign in</AppText>
        {banner ? <FormBanner variant="error" message={banner} /> : null}
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
          returnKeyType="next"
        />
        <AppTextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          error={errs.password}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={submit}
        />
        <PrimaryButton
          label={pending ? 'Signing in…' : 'Sign in'}
          loading={pending}
          disabled={email.length === 0 || password.length === 0}
          onPress={submit}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <AppText token="label" color="accent" onPress={() => router.push('/(auth)/forgot-password')}>
            Forgot password?
          </AppText>
          <AppText token="label" color="accent" onPress={() => router.replace('/(auth)/sign-up')}>
            Create account
          </AppText>
        </View>
      </View>
    </Screen>
  );
}
