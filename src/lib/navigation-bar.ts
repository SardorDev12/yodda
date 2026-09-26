import { NavigationBar } from 'expo-navigation-bar';
import { Platform } from 'react-native';

import type { Scheme } from '@/theme';

/**
 * Keeps the Android system navigation bar's button style in sync with the
 * app's theme so its icons stay legible against our background. The bar
 * itself is edge-to-edge/transparent (SDK 57+ has no background-color API);
 * `enforceContrast: false` in app.json's expo-navigation-bar plugin turns
 * off Android's own dimming scrim so our background shows through cleanly.
 */
export function syncNavigationBar(scheme: Scheme): void {
  if (Platform.OS !== 'android') return;
  try {
    NavigationBar.setStyle(scheme === 'dark' ? 'dark' : 'light');
  } catch {
    // Best-effort; never block rendering on this.
  }
}
