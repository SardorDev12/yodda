import { NavigationBar } from 'expo-navigation-bar';
import { Platform } from 'react-native';
import * as SystemUI from 'expo-system-ui';

import type { Scheme, ThemeColors } from '@/theme';

/**
 * Keeps the Android system chrome in sync with the app's theme:
 * - the nav bar's icon style (dark/light), so icons stay legible
 * - the root window's background color, which is what actually shows
 *   through behind the transparent edge-to-edge nav bar (SDK 57 dropped
 *   the nav bar's own background-color API — the bar is fully
 *   transparent, so whatever's behind it, normally Android's default
 *   black window background, is what renders there unless we set it).
 *
 * expo-navigation-bar's `style` naming is inverted from its own
 * TypeScript docs — confirmed in its native module (NavigationBarModule.kt):
 * `style === "dark"` sets `hasLightBackground = true` (dark icons, for a
 * light background); `style === "light"` gives light/white icons (for a
 * dark background).
 */
export function syncAndroidChrome(scheme: Scheme, colors: ThemeColors): void {
  if (Platform.OS !== 'android') return;
  try {
    NavigationBar.setStyle(scheme === 'dark' ? 'light' : 'dark');
  } catch {
    // Best-effort; never block rendering on this.
  }
  SystemUI.setBackgroundColorAsync(colors.bg).catch(() => {});
}
