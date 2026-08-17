// Design tokens — single source of truth for all visual values

export const COLORS = {
  // Brand
  primary: '#2d6cdf',
  primaryLight: '#eef3ff',
  primaryDark: '#1a4fa8',

  // Semantic
  success: '#1bb35c',
  successLight: '#eaf8ef',
  warning: '#e07b00',
  warningLight: '#fff4e5',
  danger: '#e03d3d',
  dangerLight: '#fdeaea',
  info: '#0891b2',

  // Neutrals
  textPrimary: '#142038',
  textSecondary: '#6b7fa3',
  textMuted: '#9aa3b3',
  textPlaceholder: '#b0bcd4',

  // Backgrounds
  bgApp: '#f7f9ff',
  bgCard: '#ffffff',
  bgInput: '#ffffff',
  bgMuted: '#eef1f7',

  // Borders
  border: '#d7e1f0',
  borderLight: '#eef1f7',
  borderFocus: '#2d6cdf',

  // Roles
  admin: '#6b7fa3',
  projectManager: '#2d6cdf',
  worker: '#1bb35c',
};

export const FONT_SIZE = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 15,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 22,
  '4xl': 26,
};

export const FONT_WEIGHT = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 14,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 20,
  full: 999,
};

export const SHADOW = {
  sm: {
    shadowColor: '#0d2a6f',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
  },
  md: {
    shadowColor: '#0d2a6f',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 4},
    elevation: 5,
  },
};

const theme = {COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS, SHADOW};
export default theme;
