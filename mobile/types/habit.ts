export type HabitType = 'check' | 'count' | 'minutes';

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: HabitType;
  target: number;
  scheduledDays: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  reminderTime?: string | null; // e.g. "08:30"
  createdAt: string; // ISO string
  archivedAt?: string | null; // ISO string or null
  sortOrder: number;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD local date string
  value: number;
  note?: string | null;
  skipped?: boolean | null;
}

export type ThemePreference = 'system' | 'light' | 'dark';

export interface AppSettings {
  userName?: string;
  theme: ThemePreference;
  weekStartDay: 0 | 1; // 0 = Sunday, 1 = Monday
  remindersEnabled: boolean;
  hasCompletedOnboarding: boolean;
  hasSeenSwipeHint: boolean;
  reduceMotion: boolean;
}

export interface StreakStats {
  currentStreak: number;
  bestStreak: number;
  completionRate7d: number; // 0 to 100 percentage
  completionRate30d: number; // 0 to 100 percentage
  isAtRisk: boolean; // Missed yesterday, scheduled today, not yet completed today
  lastCompletedDate: string | null;
  totalCompletions: number;
}
