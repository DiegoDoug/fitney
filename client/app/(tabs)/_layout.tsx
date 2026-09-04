import { Tabs } from 'expo-router';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/design-system/theme';
import { AppText } from '@/components/ui';

/**
 * Five-position bottom navigation (SPEC §4, UX-DEC-01): Today · Plan · Log(+) ·
 * Progress · Library. Log is a RAISED ACTION that opens the Log sheet — not a
 * navigable destination and not a back-stack entry.
 */
export default function TabsLayout() {
  const t = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.colors.accent,
        tabBarInactiveTintColor: t.colors.textMuted,
        tabBarStyle: { backgroundColor: t.colors.surface, borderTopColor: t.colors.border, height: t.sizing.navBarHeight + 24 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Today', tabBarLabel: 'Today' }} />
      <Tabs.Screen name="plan" options={{ title: 'Plan' }} />
      <Tabs.Screen
        name="log-placeholder"
        options={{
          title: 'Log',
          tabBarButton: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Start or log a workout"
              onPress={() => router.push('/log')}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            >
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 999,
                  backgroundColor: t.colors.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                }}
              >
                <AppText token="title2" style={{ color: t.colors.onAccent }}>
                  +
                </AppText>
              </View>
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
      <Tabs.Screen name="library" options={{ title: 'Library' }} />
    </Tabs>
  );
}
