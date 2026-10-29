import { useEffect, useImperativeHandle, useRef, type ReactNode, type Ref } from 'react';
import { Animated, Easing, PanResponder, Platform, Pressable, StyleSheet } from 'react-native';
import { useSettings } from '@/providers/SettingsProvider';
import { radius, space, type as typo } from '@/theme/tokens';
import { useNative, useReducedMotion } from './motion';

export type ExitDir = 'left' | 'right' | 'up';
export interface SwipeCardHandle {
  /** Flies the card off-screen; resolves when it is gone. */
  exit(dir: ExitDir): Promise<void>;
}

const THRESHOLD = 110;

/**
 * The flashcard surface: slides in on mount, pulses when the answer is revealed, follows the
 * finger once revealed (right = Good, left = Again) and flies away when rated.
 */
export function SwipeCard({
  children,
  revealed,
  onTap,
  onSwipe,
  leftLabel,
  rightLabel,
  ref,
}: {
  children: ReactNode;
  revealed: boolean;
  onTap: () => void;
  onSwipe: (dir: 'left' | 'right') => void;
  leftLabel: string;
  rightLabel: string;
  ref?: Ref<SwipeCardHandle>;
}) {
  const { colors } = useSettings();
  const reduced = useReducedMotion();
  const pan = useRef(new Animated.ValueXY()).current;
  const enter = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  const leave = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const live = useRef({ revealed, onSwipe });
  live.current = { revealed, onSwipe };

  useEffect(() => {
    if (reduced) return enter.setValue(1);
    Animated.timing(enter, { toValue: 1, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: useNative }).start();
  }, [enter, reduced]);

  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduced || !revealed) return;
    Animated.sequence([
      Animated.timing(pulse, { toValue: 1.025, duration: 110, useNativeDriver: useNative }),
      Animated.spring(pulse, { toValue: 1, friction: 5, useNativeDriver: useNative }),
    ]).start();
  }, [revealed, pulse, reduced]);

  useImperativeHandle(ref, () => ({
    exit: (dir) =>
      new Promise<void>((resolve) => {
        if (reduced) return resolve();
        const target =
          dir === 'left' ? { x: -520, y: 0 } : dir === 'right' ? { x: 520, y: 0 } : { x: 0, y: -460 };
        Animated.parallel([
          Animated.timing(pan, { toValue: target, duration: 240, easing: Easing.in(Easing.cubic), useNativeDriver: useNative }),
          Animated.timing(leave, { toValue: 0, duration: 240, useNativeDriver: useNative }),
        ]).start(() => resolve());
      }),
  }));

  const settle = () =>
    Animated.spring(pan, { toValue: { x: 0, y: 0 }, friction: 6, tension: 140, useNativeDriver: useNative }).start();

  const responder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        live.current.revealed && Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderMove: (_, g) => pan.setValue({ x: g.dx, y: g.dy * 0.15 }),
      onPanResponderRelease: (_, g) => {
        if (g.dx > THRESHOLD) live.current.onSwipe('right');
        else if (g.dx < -THRESHOLD) live.current.onSwipe('left');
        else settle();
      },
      onPanResponderTerminate: settle,
    }),
  ).current;

  const opacity = Animated.multiply(enter, leave);
  const translateX = Animated.add(
    pan.x,
    enter.interpolate({ inputRange: [0, 1], outputRange: [48, 0] }),
  );
  const rotate = pan.x.interpolate({ inputRange: [-240, 0, 240], outputRange: ['-7deg', '0deg', '7deg'] });
  const rightTint = pan.x.interpolate({ inputRange: [0, THRESHOLD], outputRange: [0, 1], extrapolate: 'clamp' });
  const leftTint = pan.x.interpolate({ inputRange: [-THRESHOLD, 0], outputRange: [1, 0], extrapolate: 'clamp' });
  const rightFill = rightTint.interpolate({ inputRange: [0, 1], outputRange: [0, 0.6] });
  const leftFill = leftTint.interpolate({ inputRange: [0, 1], outputRange: [0, 0.6] });

  return (
    <Animated.View
      {...responder.panHandlers}
      style={[
        styles.wrap,
        { opacity, transform: [{ translateX }, { translateY: pan.y }, { rotate }, { scale: pulse }] },
      ]}
    >
      <Pressable
        accessible={false}
        onPress={() => !live.current.revealed && onTap()}
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        {children}
        <Animated.View
          pointerEvents="none"
          style={[styles.tint, { backgroundColor: colors.successSoft, opacity: rightFill, alignItems: 'flex-start' }]}
        >
          <Animated.Text style={[typo.heading, styles.tintLabel, { color: colors.success }]}>
            {rightLabel}
          </Animated.Text>
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          style={[styles.tint, { backgroundColor: colors.dangerSoft, opacity: leftFill, alignItems: 'flex-end' }]}
        >
          <Animated.Text style={[typo.heading, styles.tintLabel, { color: colors.danger }]}>
            {leftLabel}
          </Animated.Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  card: {
    minHeight: 240,
    justifyContent: 'center',
    padding: space.xl,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    gap: space.md,
    // Dragging must not start a text selection on web.
    ...(Platform.OS === 'web' ? ({ userSelect: 'none', cursor: 'grab' } as object) : null),
  },
  tint: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, padding: space.xl, justifyContent: 'flex-start', alignItems: 'flex-end' },
  tintLabel: { textTransform: 'uppercase', letterSpacing: 1 },
});

