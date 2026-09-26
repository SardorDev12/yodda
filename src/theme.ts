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

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
};
