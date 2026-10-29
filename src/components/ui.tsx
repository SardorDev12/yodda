import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, type ComponentProps, type ComponentRef, type ReactNode, type Ref } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '@/providers/SettingsProvider';
import { usePressScale } from './motion';
import { CONTENT_MAX_WIDTH, MIN_TOUCH, radius, space, type as typo } from '@/theme/tokens';

export type TextInputRef = ComponentRef<typeof TextInput>;
export type IconName = ComponentProps<typeof Ionicons>['name'];

/* ------------------------------ Typography ----------------------------- */

type Variant = keyof typeof typo;

export function AppText({
  variant = 'body',
  muted,
  color,
  style,
  ...rest
}: ComponentProps<typeof Text> & { variant?: Variant; muted?: boolean; color?: string }) {
  const { colors } = useSettings();
  return (
    <Text
      {...rest}
      style={[typo[variant], { color: color ?? (muted ? colors.textMuted : colors.text) }, style]}
    />
  );
}

/* -------------------------------- Layout ------------------------------- */

/** Scroll container with consistent padding and a readable max width on wide screens. */
export function Screen({
  children,
  scroll = true,
  style,
  footer,
}: {
  children: ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  footer?: ReactNode;
}) {
  const { colors } = useSettings();
  const insets = useSafeAreaInsets();
  const inner = [styles.inner, { paddingBottom: space.xxl + (footer ? 0 : insets.bottom) }, style];
  return (
    <View style={[styles.flex, { backgroundColor: colors.bg }]}>
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          contentInsetAdjustmentBehavior="automatic"
        >
          <View style={inner}>{children}</View>
        </ScrollView>
      ) : (
        <View style={[styles.flex, styles.scrollContent]}>
          <View style={[inner, styles.flex]}>{children}</View>
        </View>
      )}
      {footer}
    </View>
  );
}

export function Surface({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useSettings();
  return (
    <View style={[styles.surface, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>
      {children}
    </View>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <AppText variant="caption" muted style={styles.sectionTitle} accessibilityRole="header">
      {typeof children === 'string' ? children.toUpperCase() : children}
    </AppText>
  );
}

/* -------------------------------- Buttons ------------------------------ */

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
  style,
  accessibilityHint,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}) {
  const { colors } = useSettings();
  const off = disabled || loading;
  const press = usePressScale();
  const bg = {
    primary: colors.primary,
    secondary: colors.surfaceAlt,
    danger: colors.danger,
    ghost: 'transparent',
  }[variant];
  const fg = {
    primary: colors.onPrimary,
    secondary: colors.text,
    danger: colors.bg,
    ghost: colors.primary,
  }[variant];
  return (
    <Animated.View style={[press.style, style]}>
    <Pressable
      onPress={onPress}
      disabled={off}
      {...press.handlers}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        styles.button,
        { backgroundColor: bg, opacity: off ? 0.45 : pressed ? 0.9 : hovered ? 0.94 : 1 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={20} color={fg} /> : null}
          <Text style={[typo.bodyStrong, { color: fg }]} numberOfLines={1}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
    </Animated.View>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  color,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  color?: string;
}) {
  const { colors } = useSettings();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        styles.iconButton,
        { backgroundColor: pressed || hovered ? colors.surfaceAlt : 'transparent' },
      ]}
    >
      <Ionicons name={icon} size={22} color={color ?? colors.textMuted} />
    </Pressable>
  );
}

/* ------------------------------- Inputs -------------------------------- */

export function TextField({
  label,
  error,
  right,
  style,
  ref,
  ...rest
}: TextInputProps & { label?: string; error?: string | null; right?: ReactNode; ref?: Ref<TextInputRef> }) {
  const { colors } = useSettings();
  return (
    <View style={styles.field}>
      {label ? (
        <AppText variant="caption" muted>
          {label}
        </AppText>
      ) : null}
      <View
        style={[
          styles.inputWrap,
          { backgroundColor: colors.surface, borderColor: error ? colors.danger : colors.border },
        ]}
      >
        <TextInput
          ref={ref}
          accessibilityLabel={label ?? rest.placeholder}
          placeholderTextColor={colors.textMuted}
          {...rest}
          style={[
            typo.body,
            styles.input,
            { color: colors.text },
            Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null,
            style,
          ]}
        />
        {right}
      </View>
      {error ? (
        <AppText variant="caption" color={colors.danger} accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  const { colors } = useSettings();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={[styles.segmented, { backgroundColor: colors.surfaceAlt }]}
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            style={[
              styles.segment,
              selected && { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth },
            ]}
          >
            <Text
              numberOfLines={1}
              style={[typo.bodyStrong, { fontSize: 15, color: selected ? colors.primary : colors.textMuted }]}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Stepper({
  value,
  onChange,
  min,
  max,
  format,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  format?: (v: number) => string;
  label: string;
}) {
  const { colors } = useSettings();
  const step = (d: number) => onChange(Math.min(max, Math.max(min, value + d)));
  return (
    <View style={styles.stepper} accessibilityRole="adjustable" accessibilityLabel={label}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} −`}
        disabled={value <= min}
        onPress={() => step(-1)}
        style={[styles.stepBtn, { backgroundColor: colors.surfaceAlt, opacity: value <= min ? 0.4 : 1 }]}
      >
        <Ionicons name="remove" size={20} color={colors.text} />
      </Pressable>
      <AppText variant="bodyStrong" style={styles.stepValue}>
        {format ? format(value) : String(value)}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} +`}
        disabled={value >= max}
        onPress={() => step(1)}
        style={[styles.stepBtn, { backgroundColor: colors.surfaceAlt, opacity: value >= max ? 0.4 : 1 }]}
      >
        <Ionicons name="add" size={20} color={colors.text} />
      </Pressable>
    </View>
  );
}

/* ------------------------------- Feedback ------------------------------ */

export function Loading() {
  const { colors, t } = useSettings();
  return (
    <View style={styles.center} accessibilityLabel={t('loading')} accessibilityRole="progressbar">
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: IconName;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  const { colors } = useSettings();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icon} size={32} color={colors.primary} />
      </View>
      <AppText variant="heading" style={styles.centerText}>
        {title}
      </AppText>
      <AppText muted style={styles.centerText}>
        {body}
      </AppText>
      {action}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useSettings();
  return (
    <EmptyState
      icon="cloud-offline-outline"
      title={t('genericError')}
      body={message}
      action={<Button label={t('retry')} variant="secondary" icon="refresh" onPress={onRetry} />}
    />
  );
}

export function ProgressBar({ value }: { value: number }) {
  const { colors } = useSettings();
  const v = useRef(new Animated.Value(value)).current;
  useEffect(() => {
    // Width can't use the native driver.
    Animated.timing(v, { toValue: Math.min(1, Math.max(0, value)), duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [v, value]);
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
      style={[styles.progressTrack, { backgroundColor: colors.surfaceAlt }]}
    >
      <Animated.View
        style={[
          styles.progressFill,
          { backgroundColor: colors.primary, width: v.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
        ]}
      />
    </View>
  );
}

export function Pill({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'primary' | 'warning' | 'success';
}) {
  const { colors } = useSettings();
  const map = {
    neutral: [colors.surfaceAlt, colors.textMuted],
    primary: [colors.primarySoft, colors.primary],
    warning: [colors.warningSoft, colors.warning],
    success: [colors.successSoft, colors.success],
  }[tone];
  return (
    <View style={[styles.pill, { backgroundColor: map[0] }]}>
      <Text style={[typo.caption, { color: map[1] }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, alignItems: 'center' },
  inner: { width: '100%', maxWidth: CONTENT_MAX_WIDTH, padding: space.lg, gap: space.lg },
  surface: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: space.lg, gap: space.md },
  sectionTitle: { letterSpacing: 0.8, marginTop: space.sm },
  button: {
    minHeight: MIN_TOUCH + 4,
    paddingHorizontal: space.xl,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  iconButton: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: { gap: space.xs },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
  },
  input: { flex: 1, minHeight: MIN_TOUCH + 4, paddingVertical: space.sm },
  segmented: { flexDirection: 'row', padding: 3, borderRadius: radius.md, gap: 2 },
  segment: {
    flex: 1,
    minHeight: MIN_TOUCH - 4,
    borderRadius: radius.md - 3,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.sm,
  },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  stepBtn: { width: MIN_TOUCH, height: MIN_TOUCH, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  stepValue: { minWidth: 56, textAlign: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xxl },
  centerText: { textAlign: 'center' },
  empty: { alignItems: 'center', gap: space.md, paddingVertical: space.xxl, paddingHorizontal: space.lg },
  emptyIcon: { width: 72, height: 72, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  progressTrack: { height: 8, borderRadius: radius.pill, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: radius.pill },
  pill: { paddingHorizontal: space.sm, paddingVertical: 2, borderRadius: radius.pill },
});
