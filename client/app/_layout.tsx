import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/components/theme-provider';
import { Screen, AppText, PrimaryButton } from '@/components/ui';
import { RuntimeProvider, useAuth } from '@/runtime/context';

/**
 * Root layout — app shell (SPEC §18 Phase 0). Providers, then the runtime
 * container (ADR-0009 account lifecycle), then group-level routing:
 *
 *   signed-out / authenticating  -> (auth)/welcome
 *   recovery                     -> (auth)/reset-password
 *   onboarding                   -> (auth)/onboarding
 *   ready                        -> (tabs)
 *
 * The five-position navigation is the (tabs) group; Log is a raised action, not
 * a tab (UX-DEC-01).
 */
export default function RootLayout() {
  // DEV-ONLY: EXPO_PUBLIC_DEV_USER_ID boots straight into a seeded user with a
  // local-only fake session (no server). Not a guest fallback (AUTH-04).
  const devUserId =
    process.env.NODE_ENV !== 'production' ? process.env.EXPO_PUBLIC_DEV_USER_ID : undefined;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider preference="system">
          <RuntimeProvider devUserId={devUserId}>
            <StatusBar style="auto" />
            <AuthRouter />
          </RuntimeProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AuthRouter() {
  const { phase, initError, retryInit, handleAuthDeepLink } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const url = Linking.useURL();

  // inbound email-confirm / password-recovery deep links
  useEffect(() => {
    if (!url) return;
    if (/[?#&](access_token|code|type)=/.test(url) || url.includes('/auth/callback')) {
      void handleAuthDeepLink(url);
    }
  }, [url, handleAuthDeepLink]);

  useEffect(() => {
    const segs = segments as readonly string[];
    const top = segs[0]; // '(auth)' | '(tabs)' | 'workout' | 'log' | 'settings' | undefined
    const sub = segs[1];
    const inAuth = top === '(auth)';

    if (phase === 'bootstrapping' || phase === 'authenticating') return;

    if (phase === 'recovery') {
      if (!(inAuth && sub === 'reset-password')) router.replace('/(auth)/reset-password');
      return;
    }
    if (phase === 'signed-out') {
      if (!inAuth) router.replace('/(auth)/welcome');
      return;
    }
    if (phase === 'onboarding') {
      if (!(inAuth && sub === 'onboarding')) router.replace('/(auth)/onboarding');
      return;
    }
    if (phase === 'ready') {
      if (inAuth || top === undefined) router.replace('/(tabs)');
      return;
    }
  }, [phase, segments, router]);

  if (phase === 'error') {
    return (
      <Screen>
        <View style={{ flex: 1, justifyContent: 'center', gap: 16 }}>
          <AppText token="title2">Couldn’t start</AppText>
          <AppText color="textMuted">
            {initError ?? 'The app couldn’t open your local data. Your workouts are safe on this device.'}
          </AppText>
          <PrimaryButton label="Try again" onPress={retryInit} />
        </View>
      </Screen>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
      <Stack.Screen name="log" options={{ presentation: 'modal' }} />
      <Stack.Screen name="workout/active/[sessionId]" />
      <Stack.Screen name="workout/summary/[sessionId]" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
