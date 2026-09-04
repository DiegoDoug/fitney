import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen, AppText, PrimaryButton, AppTextField, FormBanner } from '@/components/ui';
import { useTheme } from '@/design-system/theme';
import { useAuth } from '@/runtime/context';
import { MIN_PASSWORD_LENGTH, validatePassword } from '@/services/auth';

/**
 * Set a new password (SPEC AUTH-01). Reached only from a PASSWORD_RECOVERY event
 * (the runtime routes here). On success the user has an active session — the
 * runtime transitions to onboarding or the app shell.
 */
export default function ResetPasswordScreen() {
  const t = useTheme();
  const { resetPassword, phase } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errs, setErrs] = useState<{ password?: string; confirm?: string }>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async () => {
    if (pending) return;
    const next: { password?: string; confirm?: string } = {};
    const p = validatePassword(password);
    if (p) next.password = p;
    if (confirm !== password) next.confirm = 'Passwords do not match.';
    setErrs(next);
    if (next.password || next.confirm) return;
    setBanner(null);
    setPending(true);
    const res = await resetPassword(password, confirm);
    setPending(false);
    if (!res.ok) setBanner(res.message);
  };

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', gap: t.spacing.lg }}>
        <AppText token="title1">Choose a new password</AppText>
        {phase !== 'recovery' ? (
          <FormBanner
            variant="info"
            message="Open the reset link from your email to change your password."
          />
        ) : null}
        {banner ? <FormBanner variant="error" message={banner} /> : null}
        <AppTextField
          label="New password"
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
          label="Confirm new password"
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
          label={pending ? 'Saving…' : 'Save password'}
          loading={pending}
          disabled={phase !== 'recovery' || !password || !confirm}
          onPress={submit}
        />
        <AppText token="label" color="accent" onPress={() => router.replace('/(auth)/sign-in')}>
          Back to sign in
        </AppText>
      </View>
    </Screen>
  );
}
