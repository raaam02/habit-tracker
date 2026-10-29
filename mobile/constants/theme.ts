import { StyleSheet } from 'react-native';

export type ColorTheme = {
  background: string;
  surface: string;
  elevated: string;
  surfaceHighlight: string;
  border: string;
  borderLight: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  accent: string;
  accentMuted: string;
  success: string;
  warning: string;
  danger: string;
  cardShadow: string;
  overlay: string;
  glassBackground: string;
  glassBorder: string;
};

export const darkTheme: ColorTheme = {
  background: '#0B0D10',
  surface: '#14171C',
  elevated: '#1B1F26',
  surfaceHighlight: '#232832',
  border: '#232833',
  borderLight: '#2F3543',
  text: '#F2F4F7',
  textMuted: '#8B93A1',
  textSubtle: '#525B6C',
  accent: '#3B82F6',
  accentMuted: 'rgba(59, 130, 246, 0.15)',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  cardShadow: 'rgba(0, 0, 0, 0.5)',
  overlay: 'rgba(0, 0, 0, 0.75)',
  glassBackground: 'rgba(20, 23, 28, 0.75)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
};

export const lightTheme: ColorTheme = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  elevated: '#F1F5F9',
  surfaceHighlight: '#E2E8F0',
  border: '#E2E8F0',
  borderLight: '#CBD5E1',
  text: '#0F172A',
  textMuted: '#64748B',
  textSubtle: '#94A3B8',
  accent: '#2563EB',
  accentMuted: 'rgba(37, 99, 235, 0.12)',
  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626',
  cardShadow: 'rgba(0, 0, 0, 0.08)',
  overlay: 'rgba(15, 23, 42, 0.45)',
  glassBackground: 'rgba(255, 255, 255, 0.8)',
  glassBorder: 'rgba(0, 0, 0, 0.06)',
};

export interface HabitColorItem {
  id: string;
  name: string;
  hex: string;
  bgMuted: string;
  contrastText: string;
}

export const HABIT_COLORS: HabitColorItem[] = [
  { id: 'emerald', name: 'Emerald', hex: '#10B981', bgMuted: 'rgba(16, 185, 129, 0.15)', contrastText: '#FFFFFF' },
  { id: 'sky', name: 'Sky', hex: '#0EA5E9', bgMuted: 'rgba(14, 165, 233, 0.15)', contrastText: '#FFFFFF' },
  { id: 'indigo', name: 'Indigo', hex: '#6366F1', bgMuted: 'rgba(99, 102, 241, 0.15)', contrastText: '#FFFFFF' },
  { id: 'violet', name: 'Violet', hex: '#8B5CF6', bgMuted: 'rgba(139, 92, 246, 0.15)', contrastText: '#FFFFFF' },
  { id: 'rose', name: 'Rose', hex: '#F43F5E', bgMuted: 'rgba(244, 63, 94, 0.15)', contrastText: '#FFFFFF' },
  { id: 'amber', name: 'Amber', hex: '#F59E0B', bgMuted: 'rgba(245, 158, 11, 0.15)', contrastText: '#0B0D10' },
  { id: 'coral', name: 'Coral', hex: '#FB7185', bgMuted: 'rgba(251, 113, 133, 0.15)', contrastText: '#FFFFFF' },
  { id: 'teal', name: 'Teal', hex: '#14B8A6', bgMuted: 'rgba(20, 184, 166, 0.15)', contrastText: '#FFFFFF' },
  { id: 'lime', name: 'Lime', hex: '#84CC16', bgMuted: 'rgba(132, 204, 22, 0.15)', contrastText: '#0B0D10' },
  { id: 'fuchsia', name: 'Fuchsia', hex: '#D946EF', bgMuted: 'rgba(217, 70, 239, 0.15)', contrastText: '#FFFFFF' },
];

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
};

// Increased roundness for modern iOS / Apple feel
export const RADII = {
  sm: 10,
  md: 14,
  card: 22, // Modern Apple squircle-like radius
  sheet: 32, // Smooth, deep bottom sheet radius
  pill: 9999,
  full: 9999,
};

export const TYPOGRAPHY = {
  title1: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700' as const,
  },
  title2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600' as const,
  },
  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
  },
  tiny: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500' as const,
  },
};

export const TOUCH_TARGET = 48;

// Critically damped Apple-style springs (no jarring jitter, smooth settle)
export const SPRING_CONFIG = {
  damping: 24,
  stiffness: 220,
  mass: 1.0,
};
