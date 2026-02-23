import { adaptive } from '@toss/tds-colors';

export const color = {
  bgPage: adaptive.grey50,
  bgCard: adaptive.background,
  primary: adaptive.blue500,
  primaryLight: adaptive.blue50,
  danger: adaptive.red500,
  success: adaptive.green500,
  warningBg: adaptive.orange50,
  warningBorder: adaptive.orange400,
  warningText: adaptive.orange700,
  border: adaptive.grey200,
  text: adaptive.grey900,
  textSecondary: adaptive.grey600,
  textTertiary: adaptive.grey500,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  section: 24,
} as const;

export const radius = {
  small: 6,
  medium: 8,
  large: 12,
  card: 20,
  pill: 20,
} as const;

export const layout = {
  pagePaddingH: 20,
  navHeight: 60,
  minTouchTarget: 48,
} as const;
