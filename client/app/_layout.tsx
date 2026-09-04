import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/components/theme-provider';
import { RuntimeProvider } from '@/runtime/context';

/**
 * Root layout — app shell (SPEC §18 Phase 0). ThemeProvider (light+dark tokens),
 * SafeArea + gesture-handler roots, then the runtime container. The five-position
 * navigation is the (tabs) group; Log is a raised action, not a tab (UX-DEC-01).
 */
export default function RootLayout() {
  // initialUserId is injected once the auth slice lands; until then -> (auth).
  const initialUserId = process.env.EXPO_PUBLIC_DEV_USER_ID;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider preference="system">
          <RuntimeProvider initialUserId={initialUserId}>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="log" options={{ presentation: 'modal' }} />
              <Stack.Screen name="workout/active/[sessionId]" />
              <Stack.Screen name="workout/summary/[sessionId]" options={{ presentation: 'modal' }} />
            </Stack>
          </RuntimeProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
