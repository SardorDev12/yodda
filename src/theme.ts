export const lightColors = {
  bg: '#FAFAFC',
  card: '#FFFFFF',
  primary: '#3760FA',
  primarySoft: '#EAEDFF',
  text: '#14141B',
  muted: '#8A8A99',
  border: '#EAEAF0',
  success: '#3DAE79',
  warning: '#C98A1E',
  danger: '#D64545',
};

export const darkColors = {
  bg: '#0B0B12',
  card: '#18181F',
  primary: '#8C9CFF',
  primarySoft: '#242244',
  text: '#F2F2F5',
  muted: '#9B9BAE',
  border: '#2A2A36',
  success: '#4FC08D',
  warning: '#E0A63E',
  danger: '#E86B6B',
};

export type ThemeColors = typeof lightColors;
export type Scheme = 'light' | 'dark';

export const spacing = (n: number) => n * 8;

/**
 * On a wide desktop window, unconstrained text/cards stretch to an
 * uncomfortable reading width and buttons balloon to hundreds of pixels
 * wide — the same problem fixed for Settings' toggle rows, generalized.
 * Content columns cap here, centered, while the sidebar/background still
 * use the full window.
 */
export const contentMaxWidth = 640;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
};

/**
 * Flat 1px borders read as "wireframe" at a glance — a soft shadow gives
 * cards actual depth/elevation, the way most native and web UIs separate
 * surfaces from their background. Two levels: `card` for resting content
 * cards/rows, `raised` for things that should read as "above" the rest
 * (e.g. a floating action area). Cross-platform: shadow* for iOS,
 * elevation for Android, boxShadow for web (RN Web maps shadow* to it
 * automatically, but web's rendering reads better with explicit values).
 */
export const shadow = {
  card: {
    shadowColor: '#0B0B12',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  raised: {
    shadowColor: '#0B0B12',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
};
