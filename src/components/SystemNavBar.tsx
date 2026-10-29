import { Platform, StyleSheet, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palettes } from '@/theme/tokens';

/**
 * Android system navigation bar. Android colours the three buttons from the *phone's* light/dark
 * setting, so we paint the strip behind them in the phone's colours too (light phone → white strip,
 * dark buttons; dark phone → dark strip, light buttons). The in-app theme does not affect it.
 * Pure JS: no native module, so it can ship over the air.
 */
export function SystemNavBar() {
  const device = useColorScheme() === 'dark' ? 'dark' : 'light';
  const insets = useSafeAreaInsets();
  if (Platform.OS !== 'android' || insets.bottom === 0) return null;
  return (
    <View
      pointerEvents="none"
      style={[styles.strip, { height: insets.bottom, backgroundColor: palettes[device].surface }]}
    />
  );
}

const styles = StyleSheet.create({
  strip: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
