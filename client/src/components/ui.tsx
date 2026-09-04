/**
 * Small themed primitives (visual-ui-design.md §7). Each state carries >=2
 * non-hue / non-elevation cues (VIS-DEC-06): text + border + glyph, not colour
 * alone. Neumorphic elevation is hierarchy, never the sole affordance.
 */
import { forwardRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
  type PressableProps,
  type TextInputProps,
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
}: Omit<ViewProps, 'role'> & { role?: ElevationRole }) {
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

// --------------------------------------------------------------- form controls
/** Inline field-level error: glyph + colour + text (>=2 non-hue cues, VIS-DEC-06). */
export function FieldError({ message }: { message: string }) {
  const t = useTheme();
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs, marginTop: t.spacing.xs }}
    >
      <AppText token="caption" style={{ color: t.colors.danger }}>
        {'⚠'}
      </AppText>
      <AppText token="caption" style={{ color: t.colors.danger }}>
        {message}
      </AppText>
    </View>
  );
}

type AppTextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  error?: string | undefined;
  /** shown under the field when there is no error */
  hint?: string | undefined;
};

/**
 * Labelled text field. >=48dp target, always-visible label (never placeholder-as-
 * label — NFR-A11Y), error state carried by border weight + glyph + text, not
 * hue alone.
 */
export function AppTextField({ label, value, onChangeText, error, hint, ...rest }: AppTextFieldProps) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = error
    ? t.colors.danger
    : focused
      ? t.colors.focusRing
      : t.colors.borderStrong;
  return (
    <View style={{ gap: t.spacing.xs }}>
      <AppText token="label" color="textSecondary">
        {label}
      </AppText>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={error ?? hint}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholderTextColor={t.colors.textMuted}
        style={{
          minHeight: t.sizing.minControlHeight,
          borderRadius: t.radius.field,
          borderWidth: error ? 2 : 1,
          borderColor,
          paddingHorizontal: t.spacing.md,
          paddingVertical: t.spacing.sm,
          color: t.colors.text,
          backgroundColor: t.colors.surfaceRaised,
          fontSize: t.type.body.fontSize,
        }}
        {...rest}
      />
      {error ? <FieldError message={error} /> : hint ? (
        <AppText token="caption" color="textMuted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

/** Form-level banner (auth error / neutral confirmation / info). */
export function FormBanner({
  variant,
  message,
}: {
  variant: 'error' | 'success' | 'info';
  message: string;
}) {
  const t = useTheme();
  const glyph = variant === 'error' ? '⚠' : variant === 'success' ? '✓' : 'ℹ';
  const tone =
    variant === 'error' ? t.colors.danger : variant === 'success' ? t.colors.accent : t.colors.textSecondary;
  return (
    <View
      accessibilityRole={variant === 'error' ? 'alert' : 'text'}
      accessibilityLiveRegion="polite"
      style={{
        flexDirection: 'row',
        gap: t.spacing.sm,
        alignItems: 'flex-start',
        borderWidth: 1,
        borderColor: tone,
        borderRadius: t.radius.field,
        padding: t.spacing.md,
        backgroundColor: t.colors.surface,
      }}
    >
      <AppText token="label" style={{ color: tone }}>
        {glyph}
      </AppText>
      <AppText token="body" style={{ color: t.colors.text, flex: 1 }}>
        {message}
      </AppText>
    </View>
  );
}

export type SegmentOption<T extends string | number> = { value: T; label: string };

/**
 * Single-select segmented control. The selected segment is marked by border +
 * fill + a check glyph + heavier text — not colour alone (VIS-DEC-06). Each
 * segment is a >=48dp target.
 */
export function SegmentedControl<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ReadonlyArray<SegmentOption<T>>;
  value: T;
  onChange: (v: T) => void;
}) {
  const t = useTheme();
  return (
    <View style={{ gap: t.spacing.xs }}>
      <AppText token="label" color="textSecondary">
        {label}
      </AppText>
      <View
        accessibilityRole="radiogroup"
        style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm }}
      >
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <Pressable
              key={String(opt.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={opt.label}
              onPress={() => onChange(opt.value)}
              style={{
                minHeight: t.sizing.minControlHeight,
                minWidth: t.sizing.minTouchTarget,
                paddingHorizontal: t.spacing.md,
                borderRadius: t.radius.field,
                borderWidth: selected ? 2 : 1,
                borderColor: selected ? t.colors.accent : t.colors.borderStrong,
                backgroundColor: selected ? t.colors.accentQuiet : t.colors.surfaceRaised,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: t.spacing.xs,
              }}
            >
              {selected ? (
                <AppText token="label" style={{ color: t.colors.accent }}>
                  {'✓'}
                </AppText>
              ) : null}
              <AppText
                token="label"
                style={{
                  color: selected ? t.colors.text : t.colors.textSecondary,
                  fontWeight: selected ? '700' : '500',
                }}
              >
                {opt.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** −/value/+ numeric stepper (rest timer, plate increments). Each control >=48dp. */
export function NumberStepper({
  label,
  value,
  onChange,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  suffix,
  error,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  error?: string | undefined;
}) {
  const t = useTheme();
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  const btn = (dir: -1 | 1, glyph: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${dir === 1 ? 'Increase' : 'Decrease'} ${label}`}
      onPress={() => onChange(clamp(value + dir * step))}
      style={{
        width: t.sizing.minControlHeight,
        height: t.sizing.minControlHeight,
        borderRadius: t.radius.field,
        borderWidth: 1,
        borderColor: t.colors.borderStrong,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: t.colors.surfaceRaised,
      }}
    >
      <AppText token="title2">{glyph}</AppText>
    </Pressable>
  );
  return (
    <View style={{ gap: t.spacing.xs }}>
      <AppText token="label" color="textSecondary">
        {label}
      </AppText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
        {btn(-1, '−')}
        <AppText token="metric" tabular accessibilityLabel={`${value}${suffix ? ` ${suffix}` : ''}`}>
          {value}
          {suffix ? ` ${suffix}` : ''}
        </AppText>
        {btn(1, '+')}
      </View>
      {error ? <FieldError message={error} /> : null}
    </View>
  );
}
