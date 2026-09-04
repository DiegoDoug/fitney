import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen, AppText, PrimaryButton } from '@/components/ui';
import { useTheme } from '@/design-system/theme';

/**
 * Welcome (SPEC §4.2). Entry point when signed out. Two routes only — sign in or
 * create an account. No marketing, no guest button (AUTH-04: no disposable
 * pseudo-account).
 */
export default function WelcomeScreen() {
  const t = useTheme();
  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', gap: t.spacing.lg }}>
        <AppText token="display">Fitney</AppText>
        <AppText color="textMuted">
          Plan your training by week, log every set offline, and see your progress over time.
        </AppText>
        <View style={{ height: t.spacing.md }} />
        <PrimaryButton label="Create account" onPress={() => router.push('/(auth)/sign-up')} />
        <PrimaryButton
          label="I already have an account"
          variant="secondary"
          onPress={() => router.push('/(auth)/sign-in')}
        />
      </View>
    </Screen>
  );
}
