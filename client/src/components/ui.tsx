/**
 * Small themed primitives (visual-ui-design.md §7). Each state carries >=2
 * non-hue / non-elevation cues (VIS-DEC-06): text + border + glyph, not colour
 * alone. Neumorphic elevation is hierarchy, never the sole affordance.
 */
import { forwardRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  type PressableProps,
  type TextProps,
  type ViewProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/design-system/theme';
import { elevationStyle } from '@/design-system/elevation';
import { TABULAR_FONT_VARIANT } from '@/design-system/typography';
import type { ElevationRole } from '@/design-system/tokens';

export function Screen({ children, ...rest }: ViewProps) {
  const t = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.canvas }} edges={['top', 'left', 'right']}>
      <View style={[{ flex: 1, paddingHorizontal: t.spacing.lg }, rest.style]} {...rest}>
        {children}
      </View>
    </SafeAreaView>
  );
}

type AppTextProps = TextProps & {
  token?: keyof ReturnType<typeof useTheme>['type'];
  color?: 'text' | 'textSecondary' | 'textMuted' | 'accent' | 'danger' | 'onAccent';
  tabular?: boolean;
};

export function AppText({ token = 'body', color = 'text', tabular, style, ...rest }: AppTextProps) {
  const t = useTheme();
  const tok = t.type[token];
  return (
    <Text
      style={[
        {
          fontSize: tok.fontSize,
          lineHeight: tok.lineHeight,
          fontWeight: tok.fontWeight,
          color: t.colors[color],
        },
        (tabular ?? tok.tabular) ? { fontVariant: TABULAR_FONT_VARIANT } : null,
        style,
      ]}
      {...rest}
    />
  );
}

export function AppSurface({
  role = 'flat',
  style,
  children,
  ...rest
}: ViewProps & { role?: ElevationRole }) {
  const t = useTheme();
  return (
    <View
      style={[
        { borderRadius: t.radius.listCard, padding: t.spacing.lg, backgroundColor: t.colors.surface },
        elevationStyle(role, t.colors),
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

type PrimaryButtonProps = PressableProps & {
  label: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'destructive';
  isLogAction?: boolean; // the one place raised-2 is allowed on a button (VIS-DEC-05)
};

export const PrimaryButton = forwardRef<View, PrimaryButtonProps>(function PrimaryButton(
  { label, loading, disabled, variant = 'primary', isLogAction, onPress, ...rest },
  ref,
) {
  const t = useTheme();
  const bg =
    disabled
      ? t.colors.surface
      : variant === 'destructive'
        ? t.colors.danger
        : variant === 'secondary'
          ? t.colors.surfaceRaised
          : t.colors.accent;
  const fg = disabled
    ? t.colors.textMuted
    : variant === 'secondary'
      ? t.colors.text
      : t.colors.onAccent;
  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      accessibilityLabel={label}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: t.sizing.primaryCtaHeight,
          borderRadius: t.radius.field,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: t.spacing.xl,
          backgroundColor: pressed && !disabled ? t.colors.accentPressed : bg,
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: t.colors.borderStrong,
        },
        elevationStyle(isLogAction ? 'raised-2' : 'raised-1', t.colors),
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <AppText token="label" style={{ color: fg }}>
          {label}
        </AppText>
      )}
    </Pressable>
  );
});
