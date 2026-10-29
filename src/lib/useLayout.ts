import { Platform, useWindowDimensions } from 'react-native';

export const SIDEBAR_BREAKPOINT = 768;

/** Web at desktop/tablet width shows the sidebar; phones (native or narrow web) use the bottom tab bar. */
export function useShowSidebar(): boolean {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= SIDEBAR_BREAKPOINT;
}
