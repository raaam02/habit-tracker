import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Habit, HabitLog } from '../types/habit';
import { useAppTheme } from '../constants/useAppTheme';
import { computeStreakStats } from '../utils/streaks';
import { TYPOGRAPHY, SPACING, RADII, TOUCH_TARGET } from '../constants/theme';
import { triggerHaptic } from '../services/haptics';

export interface HabitPerformanceRowProps {
  habit: Habit;
  logs: HabitLog[];
  date: string;
  onPress: () => void;
}

export const HabitPerformanceRow: React.FC<HabitPerformanceRowProps> = ({
  habit,
  logs,
  date,
  onPress,
}) => {
  const { theme } = useAppTheme();
  const stats = computeStreakStats(habit, logs, date);

  return (
    <Pressable
      onPress={() => {
        triggerHaptic.light();
        onPress();
      }}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? theme.surfaceHighlight : theme.surface,
          borderColor: theme.border,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`View stats for ${habit.name}`}
    >
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: `${habit.color}20` },
        ]}
      >
        <Ionicons name={habit.icon as any} size={20} color={habit.color} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {habit.name}
        </Text>
        <Text style={[styles.meta, { color: theme.textMuted }]}>
          7d: {stats.completionRate7d}% • 30d: {stats.completionRate30d}%
        </Text>
      </View>

      <View style={styles.streakCol}>
        <View style={styles.flameRow}>
          <Ionicons
            name="flame"
            size={15}
            color={stats.isAtRisk ? theme.warning : '#F97316'}
          />
          <Text
            style={[
              styles.streakNumber,
              { color: stats.isAtRisk ? theme.warning : theme.text },
            ]}
          >
            {stats.currentStreak}
          </Text>
        </View>
        {stats.isAtRisk && (
          <Text style={[styles.atRiskPill, { color: theme.warning }]}>At Risk</Text>
        )}
      </View>

      <Ionicons name="chevron-forward" size={16} color={theme.textSubtle} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADII.card,
    borderWidth: 1,
    marginBottom: SPACING.sm,
    minHeight: TOUCH_TARGET,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  content: {
    flex: 1,
  },
  name: {
    ...TYPOGRAPHY.headline,
    fontSize: 15,
  },
  meta: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    marginTop: 2,
  },
  streakCol: {
    alignItems: 'flex-end',
    marginRight: SPACING.sm,
  },
  flameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  streakNumber: {
    ...TYPOGRAPHY.headline,
    fontSize: 14,
    fontWeight: '700',
  },
  atRiskPill: {
    ...TYPOGRAPHY.tiny,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 1,
  },
});
