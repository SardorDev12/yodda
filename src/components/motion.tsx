import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

/** Transform/opacity can run on the native thread; react-native-web has no native driver. */
export const useNative = Platform.OS !== 'web';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced).catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => sub.remove();
  }, []);
  return reduced;
}

/** Fades in and rises slightly on mount. `delay` staggers siblings. */
export function FadeIn({
  children,
  delay = 0,
  distance = 14,
  duration = 360,
  style,
}: {
  children: ReactNode;
  delay?: number;
  distance?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) return v.setValue(1);
    const a = Animated.timing(v, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: useNative,
    });
    a.start();
    return () => a.stop();
  }, [v, delay, duration, reduced]);
  return (
    <Animated.View
      style={[{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }] }, style]}
    >
      {children}
    </Animated.View>
  );
}

/** Springs in from a smaller scale (dialogs, rating buttons, celebratory icons). */
export function PopIn({
  children,
  delay = 0,
  from = 0.88,
  style,
}: {
  children: ReactNode;
  delay?: number;
  from?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) return v.setValue(1);
    const a = Animated.sequence([
      Animated.delay(delay),
      Animated.spring(v, { toValue: 1, friction: 6, tension: 120, useNativeDriver: useNative }),
    ]);
    a.start();
    return () => a.stop();
  }, [v, delay, reduced]);
  return (
    <Animated.View
      style={[
        {
          opacity: v.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1, 1] }),
          transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [from, 1] }) }],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Scale-down press feedback: spread `handlers` onto a Pressable, apply `style` to a wrapping Animated.View. */
export function usePressScale(to = 0.96) {
  const scale = useRef(new Animated.Value(1)).current;
  return useMemo(() => {
    const go = (toValue: number) =>
      Animated.spring(scale, { toValue, friction: 7, tension: 220, useNativeDriver: useNative }).start();
    return {
      style: { transform: [{ scale }] },
      handlers: { onPressIn: () => go(to), onPressOut: () => go(1) },
    };
  }, [scale, to]);
}

/** Animates an integer toward `value` (count-up on first load, tween on change). */
export function useCountUp(value: number, duration = 700): number {
  const reduced = useReducedMotion();
  const anim = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = anim.addListener(({ value: v }) => setShown(Math.round(v)));
    return () => anim.removeListener(id);
  }, [anim]);
  useEffect(() => {
    if (reduced) {
      anim.setValue(value);
      return;
    }
    const a = Animated.timing(anim, { toValue: value, duration, easing: Easing.out(Easing.cubic), useNativeDriver: false });
    a.start();
    return () => a.stop();
  }, [anim, value, duration, reduced]);
  return shown;
}

const CONFETTI_COLORS = ['#4F46E5', '#16A34A', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'];

/** One-shot burst of confetti from the centre of its (absolutely filled) parent. */
export function Confetti({ count = 26 }: { count?: number }) {
  const reduced = useReducedMotion();
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const dist = 110 + Math.random() * 130;
        return {
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist - 40,
          spin: (Math.random() - 0.5) * 720,
          size: 7 + Math.random() * 6,
          color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          round: i % 3 === 0,
        };
      }),
    [count],
  );
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) return;
    const a = Animated.timing(v, { toValue: 1, duration: 1300, easing: Easing.out(Easing.cubic), useNativeDriver: useNative });
    a.start();
    return () => a.stop();
  }, [v, reduced]);
  if (reduced) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {pieces.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: '50%',
            top: '38%',
            width: p.size,
            height: p.size * (p.round ? 1 : 0.5),
            borderRadius: p.round ? p.size : 2,
            backgroundColor: p.color,
            opacity: v.interpolate({ inputRange: [0, 0.1, 0.75, 1], outputRange: [0, 1, 1, 0] }),
            transform: [
              { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, p.dx] }) },
              // Gravity: ease the fall in on top of the outward burst.
              { translateY: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, p.dy, p.dy + 90] }) },
              { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.spin}deg`] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}
