import { usePathname, useRouter } from 'expo-router';
import { PanResponder, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_ROUTES = ['/', '/library', '/settings'] as const;
const EDGE_ZONE_WIDTH = 28;
const EDGE_INSET_FROM_BORDER = 6;
const SWIPE_THRESHOLD = 48;
// Keeps the strip clear of the header (menu button) and tab bar, so it only
// covers the main content area, not tappable chrome.
const HEADER_CLEARANCE = 56;
const TAB_BAR_CLEARANCE = 64;

function currentTabIndex(pathname: string): number {
  const index = TAB_ROUTES.indexOf(pathname as (typeof TAB_ROUTES)[number]);
  return index === -1 ? 0 : index;
}

/**
 * Two narrow gesture strips near (but not touching) the screen edges that
 * swipe between tabs. Kept off the true edge so it doesn't fight Android's
 * system back-gesture zone, and off the center so normal content scrolling
 * is never intercepted.
 */
export function EdgeSwipeZones() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const top = insets.top + HEADER_CLEARANCE;
  const bottom = insets.bottom + TAB_BAR_CLEARANCE;

  function navigate(direction: 1 | -1) {
    const index = currentTabIndex(pathname);
    const next = index + direction;
    if (next < 0 || next >= TAB_ROUTES.length) return;
    router.replace(TAB_ROUTES[next] as never);
  }

  // Recreated each render (cheap: no gesture is in flight between renders),
  // so callbacks always close over the current pathname without needing refs.
  const leftPanResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_evt, gesture) =>
      Math.abs(gesture.dx) > 12 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
    onPanResponderRelease: (_evt, gesture) => {
      if (gesture.dx > SWIPE_THRESHOLD) navigate(-1);
    },
  });

  const rightPanResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_evt, gesture) =>
      Math.abs(gesture.dx) > 12 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
    onPanResponderRelease: (_evt, gesture) => {
      if (gesture.dx < -SWIPE_THRESHOLD) navigate(1);
    },
  });

  return (
    <>
      <View
        pointerEvents="box-only"
        style={{ position: 'absolute', top, bottom, left: EDGE_INSET_FROM_BORDER, width: EDGE_ZONE_WIDTH }}
        {...leftPanResponder.panHandlers}
      />
      <View
        pointerEvents="box-only"
        style={{ position: 'absolute', top, bottom, right: EDGE_INSET_FROM_BORDER, width: EDGE_ZONE_WIDTH }}
        {...rightPanResponder.panHandlers}
      />
    </>
  );
}
