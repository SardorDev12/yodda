import { NavigationBar } from 'expo-navigation-bar';
import { Platform, StyleSheet, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palettes } from '@/theme/tokens';

/**
 * Android system navigation bar: always follows the *device* light/dark theme, on every screen,
 * independent of the in-app theme setting. The app draws edge-to-edge, so the bar's colour is
 * whatever sits behind it; we paint that strip and match the button colours to it.
 */
export function SystemNavBar() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const insets = useSafeAreaInsets();
  if (Platform.OS !== 'android') return null;
  return (
    <>
      {/* 'dark' = dark bar with light buttons. */}
      <NavigationBar style={scheme} />
      <View
        pointerEvents="none"
        style={[styles.strip, { height: insets.bottom, backgroundColor: palettes[scheme].surface }]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  strip: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
