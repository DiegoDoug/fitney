import { useColorScheme } from 'react-native';
import { useMemo, type ReactNode } from 'react';
import { ThemeContext, buildTheme, resolveThemeName, type ThemePreference } from '@/design-system/theme';

/**
 * Applies the resolved theme. `preference` comes from profiles.theme (FR-SET-01);
 * 'system' follows the OS. Tokens ship light + dark from day one (VIS-DEC-03);
 * dark-at-launch is a Product flag (services/Config.darkModeAtLaunch, OQ-8).
 */
export function ThemeProvider({
  preference = 'system',
  children,
}: {
  preference?: ThemePreference;
  children: ReactNode;
}) {
  const systemScheme = useColorScheme();
  const theme = useMemo(
    () => buildTheme(resolveThemeName(preference, systemScheme === 'dark')),
    [preference, systemScheme],
  );
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
