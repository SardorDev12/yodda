export type ThemeName = 'light' | 'dark';

export interface Palette {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  primarySoft: string;
  onPrimary: string;
  danger: string;
  dangerSoft: string;
  warning: string;
  warningSoft: string;
  success: string;
  successSoft: string;
  overlay: string;
}

export const palettes: Record<ThemeName, Palette> = {
  light: {
    bg: '#F6F7FB',
    surface: '#FFFFFF',
    surfaceAlt: '#EEF0F8',
    border: '#E1E4EF',
    text: '#111827',
    textMuted: '#5B6478',
    primary: '#4F46E5',
    primarySoft: '#E8E7FD',
    onPrimary: '#FFFFFF',
    danger: '#C62828',
    dangerSoft: '#FDE8E8',
    warning: '#B45309',
    warningSoft: '#FEF0D9',
    success: '#15803D',
    successSoft: '#DCF5E4',
    overlay: 'rgba(17,24,39,0.5)',
  },
  dark: {
    bg: '#0E1118',
    surface: '#171B26',
    surfaceAlt: '#212637',
    border: '#2A3045',
    text: '#F3F4F8',
    textMuted: '#A3ABC0',
    primary: '#8B87FF',
    primarySoft: '#26254D',
    onPrimary: '#0E1118',
    danger: '#FF7B7B',
    dangerSoft: '#3A1C20',
    warning: '#F5B04C',
    warningSoft: '#3A2D15',
    success: '#5BD58A',
    successSoft: '#163323',
    overlay: 'rgba(0,0,0,0.65)',
  },
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;
export const MIN_TOUCH = 44;
export const CONTENT_MAX_WIDTH = 720;

export const type = {
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const },
  heading: { fontSize: 20, lineHeight: 26, fontWeight: '700' as const },
  body: { fontSize: 16, lineHeight: 23, fontWeight: '400' as const },
  bodyStrong: { fontSize: 16, lineHeight: 23, fontWeight: '600' as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' as const },
};
