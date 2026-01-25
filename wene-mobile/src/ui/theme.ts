/**
 * We-ne Design System
 * 白黒ミニマルデザイン
 */

export const colors = {
  // 基本色
  white: '#ffffff',
  black: '#000000',
  
  // グレースケール
  gray50: '#fafafa',
  gray100: '#f5f5f5',
  gray200: '#e0e0e0',
  gray300: '#cccccc',
  gray400: '#999999',
  gray500: '#666666',
  gray600: '#333333',
  gray900: '#000000',
  
  // セマンティック（白黒のみ）
  background: '#ffffff',
  surface: '#ffffff',
  text: '#000000',
  textSecondary: '#666666',
  textTertiary: '#999999',
  border: '#e0e0e0',
  divider: '#e0e0e0',
  
  // 状態色（白黒で表現）
  active: '#000000',
  inactive: '#999999',
  error: '#000000', // エラーも黒で表現（テキストで区別）
  disabled: '#cccccc',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 16,
  lg: 24,
} as const;

export const typography = {
  // 見出し
  h1: {
    fontSize: 48,
    fontWeight: 'bold' as const,
    lineHeight: 56,
    color: colors.text,
  },
  h2: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    lineHeight: 40,
    color: colors.text,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
    color: colors.text,
  },
  // 本文
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    color: colors.text,
  },
  bodyLarge: {
    fontSize: 18,
    fontWeight: '400' as const,
    lineHeight: 28,
    color: colors.text,
  },
  // 注釈
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  small: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    color: colors.textTertiary,
  },
} as const;

export const theme = {
  colors,
  spacing,
  radius,
  typography,
} as const;

export type Theme = typeof theme;
