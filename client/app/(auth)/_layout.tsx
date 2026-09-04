import { Stack } from 'expo-router';

/**
 * Unauthenticated + first-run group (SPEC §4.2). Reached whenever the runtime is
 * `signed-out` / `authenticating` / `onboarding` / `recovery`; the root layout
 * owns the redirect between this group and `(tabs)`.
 */
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
