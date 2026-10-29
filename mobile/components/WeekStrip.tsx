import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../constants/useAppTheme';
import { useHabitStore } from '../store/habitStore';
import {
  getWeekDates,
  formatShortDay,
  formatDayNumber,
  isTodayDate,
  shiftDateString,
  getWeekday,
} from '../utils/date';
import { triggerHaptic } from '../services/haptics';
import { SPACING, RADII, TYPOGRAPHY, TOUCH_TARGET } from '../constants/theme';
import { isDayCompleted, isDayScheduled } from '../utils/streaks';

interface WeekStripProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export const WeekStrip: React.FC<WeekStripProps> = ({ selectedDate, onSelectDate }) => {
  const { theme } = useAppTheme();
  const weekStartDay = useHabitStore((state) => state.settings.weekStartDay);
  const habits = useHabitStore((state) => state.habits);
  const logs = useHabitStore((state) => state.logs);

  const weekDates = getWeekDates(selectedDate, weekStartDay);

  const handlePrevWeek = () => {
    triggerHaptic.selection();
    onSelectDate(shiftDateString(selectedDate, -7));
  };

  const handleNextWeek = () => {
    triggerHaptic.selection();
    onSelectDate(shiftDateString(selectedDate, 7));
  };

  return (
    <View style={styles.container}>
      <View style={styles.navRow}>
        <Pressable
          onPress={handlePrevWeek}
          style={({ pressed }) => [
            styles.navButton,
            { backgroundColor: pressed ? theme.surfaceHighlight : 'transparent' },
          ]}
          hitSlop={8}
          accessibilityLabel="Previous week"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={18} color={theme.textMuted} />
        </Pressable>

        <View style={styles.daysRow}>
          {weekDates.map((dateStr) => {
            const isSelected = dateStr === selectedDate;
            const isToday = isTodayDate(dateStr);

            // Compute completion status for this day
            const scheduledForDay = habits.filter(
              (h) => !h.archivedAt && isDayScheduled(h, dateStr)
            );
            const totalScheduled = scheduledForDay.length;
            const completedCount = scheduledForDay.filter((h) => {
              const log = logs.find((l) => l.habitId === h.id && l.date === dateStr);
              return isDayCompleted(h, log);
            }).length;

            const isFullyDone = totalScheduled > 0 && completedCount >= totalScheduled;
            const isPartiallyDone = totalScheduled > 0 && completedCount > 0 && completedCount < totalScheduled;

            return (
              <Pressable
                key={dateStr}
                onPress={() => {
                  triggerHaptic.selection();
                  onSelectDate(dateStr);
                }}
                style={({ pressed }) => [
                  styles.dayCell,
                  {
                    backgroundColor: isSelected
                      ? theme.accent
                      : pressed
                      ? theme.surfaceHighlight
                      : theme.surface,
                    borderColor: isSelected
                      ? theme.accent
                      : isToday
                      ? theme.accentMuted
                      : theme.border,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${formatShortDay(dateStr)}, ${formatDayNumber(dateStr)}${
                  isToday ? ', Today' : ''
                }${isSelected ? ', Selected' : ''}`}
              >
                <Text
                  style={[
                    styles.dayName,
                    {
                      color: isSelected
                        ? '#FFFFFF'
                        : isToday
                        ? theme.accent
                        : theme.textMuted,
                      fontWeight: isSelected || isToday ? '700' : '500',
                    },
                  ]}
                >
                  {formatShortDay(dateStr)}
                </Text>
                <Text
                  style={[
                    styles.dayNum,
                    {
                      color: isSelected
                        ? '#FFFFFF'
                        : theme.text,
                      fontWeight: isSelected ? '700' : '600',
                    },
                  ]}
                >
                  {formatDayNumber(dateStr)}
                </Text>

                {/* Day status dot */}
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: isSelected
                        ? '#FFFFFF'
                        : isFullyDone
                        ? theme.success
                        : isPartiallyDone
                        ? theme.warning
                        : 'transparent',
                    },
                  ]}
                />
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={handleNextWeek}
          style={({ pressed }) => [
            styles.navButton,
            { backgroundColor: pressed ? theme.surfaceHighlight : 'transparent' },
          ]}
          hitSlop={8}
          accessibilityLabel="Next week"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.xs,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    width: 32,
    height: 48,
    borderRadius: RADII.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  daysRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xs,
  },
  dayCell: {
    flex: 1,
    marginHorizontal: 2,
    minHeight: 58,
    borderRadius: RADII.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  dayName: {
    ...TYPOGRAPHY.tiny,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  dayNum: {
    ...TYPOGRAPHY.body,
    fontSize: 15,
    marginTop: 2,
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 3,
  },
});
