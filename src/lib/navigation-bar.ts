import { NavigationBar } from 'expo-navigation-bar';
import { Platform } from 'react-native';

import type { Scheme } from '@/theme';

/**
 * Keeps the Android system navigation bar's button style in sync with the
 * app's theme so its icons stay legible against our background. The bar
 * itself is edge-to-edge/transparent (SDK 57+ has no background-color API);
 * `enforceContrast: false` in app.json's expo-navigation-bar plugin turns
 * off Android's own dimming scrim so our background shows through cleanly.
 *
 * expo-navigation-bar's `style` naming is inverted from its own TypeScript
 * docs — confirmed in its native module (NavigationBarModule.kt):
 * `style === "dark"` sets `hasLightBackground = true` (dark icons, for our
 * light theme's light background); `style === "light"` gives light/white
 * icons (for a dark background). Passing the "obvious" value produced
 * white-on-white icons on the light theme.
 */
export function syncNavigationBar(scheme: Scheme): void {
  if (Platform.OS !== 'android') return;
  try {
    NavigationBar.setStyle(scheme === 'dark' ? 'light' : 'dark');
  } catch {
    // Best-effort; never block rendering on this.
  }
}
