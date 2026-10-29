import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { Habit, HabitLog } from '../types/habit';
import { useAppTheme } from '../constants/useAppTheme';
import { useHabitStore } from '../store/habitStore';
import {
  getWeekDates,
  formatShortDay,
  formatDayNumber,
  isTodayDate,
} from '../utils/date';
import { SPACING, RADII, TYPOGRAPHY } from '../constants/theme';
import { isDayCompleted, isDayScheduled } from '../utils/streaks';

interface WeeklyBarChartProps {
  selectedDate: string;
}

export const WeeklyBarChart: React.FC<WeeklyBarChartProps> = ({ selectedDate }) => {
  const { theme } = useAppTheme();
  const weekStartDay = useHabitStore((state) => state.settings.weekStartDay);
  const habits = useHabitStore((state) => state.habits);
  const logs = useHabitStore((state) => state.logs);

  const weekDates = getWeekDates(selectedDate, weekStartDay);
  const activeHabits = habits.filter((h) => !h.archivedAt);

  const barData = weekDates.map((dateStr) => {
    const scheduled = activeHabits.filter((h) => isDayScheduled(h, dateStr));
    const total = scheduled.length;
    const completed = scheduled.filter((h) => {
      const log = logs.find((l) => l.habitId === h.id && l.date === dateStr);
      return isDayCompleted(h, log);
    }).length;

    const rate = total > 0 ? completed / total : 0;
    return {
      date: dateStr,
      label: formatShortDay(dateStr),
      dayNum: formatDayNumber(dateStr),
      isToday: isTodayDate(dateStr),
      rate,
      completed,
      total,
    };
  });

  const chartHeight = 110;

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text style={[styles.title, { color: theme.text }]}>Weekly Completion</Text>

      <View style={styles.chartRow}>
        {barData.map((d) => {
          const filledHeight = Math.max(4, Math.round(d.rate * chartHeight));
          return (
            <View key={d.date} style={styles.column}>
              <Text style={[styles.percentLabel, { color: theme.textMuted }]}>
                {Math.round(d.rate * 100)}%
              </Text>
              <View style={[styles.barTrack, { height: chartHeight, backgroundColor: theme.surfaceHighlight }]}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: filledHeight,
                      backgroundColor: d.rate === 1 ? theme.success : theme.accent,
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.dayLabel,
                  {
                    color: d.isToday ? theme.accent : theme.textMuted,
                    fontWeight: d.isToday ? '700' : '500',
                  },
                ]}
              >
                {d.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.base,
    borderRadius: RADII.card,
    borderWidth: 1,
    marginVertical: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.headline,
    fontSize: 16,
    marginBottom: SPACING.md,
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
    paddingHorizontal: SPACING.xs,
  },
  column: {
    alignItems: 'center',
    flex: 1,
  },
  percentLabel: {
    ...TYPOGRAPHY.tiny,
    fontSize: 10,
    marginBottom: 4,
  },
  barTrack: {
    width: 22,
    borderRadius: RADII.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: RADII.sm,
  },
  dayLabel: {
    ...TYPOGRAPHY.tiny,
    marginTop: 6,
    fontSize: 11,
  },
});
