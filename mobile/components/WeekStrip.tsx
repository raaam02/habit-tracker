import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutChangeEvent,
} from 'react-native';
import { useAppTheme } from '../constants/useAppTheme';
import { useHabitStore } from '../store/habitStore';
import {
  getWeekDates,
  formatShortDay,
  formatDayNumber,
  isTodayDate,
  shiftDateString,
} from '../utils/date';
import { triggerHaptic } from '../services/haptics';
import { SPACING, RADII, TYPOGRAPHY } from '../constants/theme';
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

  const scrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const [containerWidth, setContainerWidth] = useState(
    Math.min(Dimensions.get('window').width - SPACING.base * 2, 520)
  );

  // Generate 7 consecutive weeks centered around the selected date: offsets -3, -2, -1, 0, 1, 2, 3
  const weekOffsets = useMemo(() => [-3, -2, -1, 0, 1, 2, 3], []);
  const initialPageIndex = 3; // Center index (0 offset)

  const weeksData = useMemo(() => {
    return weekOffsets.map((offset) => {
      const anchorDate = shiftDateString(selectedDate, offset * 7);
      return {
        offset,
        dates: getWeekDates(anchorDate, weekStartDay),
      };
    });
  }, [selectedDate, weekStartDay, weekOffsets]);

  // Scroll to center week on mount or when container width changes
  useEffect(() => {
    if (scrollRef.current && containerWidth > 0) {
      scrollRef.current.scrollTo({
        x: initialPageIndex * containerWidth,
        animated: false,
      });
    }
  }, [containerWidth]);

  const handleLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 0 && Math.abs(width - containerWidth) > 1) {
      setContainerWidth(width);
    }
  };

  const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / containerWidth);
    if (page !== initialPageIndex && page >= 0 && page < weeksData.length) {
      triggerHaptic.selection();
      const targetWeek = weeksData[page];
      // Select corresponding day of week in the new week
      const currentSelectedWeekdayDates = weeksData[initialPageIndex].dates;
      const dayIndex = currentSelectedWeekdayDates.indexOf(selectedDate);
      const newSelectedDate =
        dayIndex >= 0 && dayIndex < targetWeek.dates.length
          ? targetWeek.dates[dayIndex]
          : targetWeek.dates[0];

      onSelectDate(newSelectedDate);
    }
  };

  return (
    <View style={styles.wrapper} onLayout={handleLayout}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        onMomentumScrollEnd={handleMomentumScrollEnd}
        contentContainerStyle={styles.scrollContent}
      >
        {weeksData.map((week) => (
          <View key={week.offset} style={[styles.weekPage, { width: containerWidth }]}>
            <View style={styles.daysContainer}>
              {week.dates.map((dateStr) => {
                const isSelected = dateStr === selectedDate;
                const isToday = isTodayDate(dateStr);

                // Compute completion for day
                const scheduledForDay = habits.filter(
                  (h) => !h.archivedAt && isDayScheduled(h, dateStr)
                );
                const totalScheduled = scheduledForDay.length;
                const completedCount = scheduledForDay.filter((h) => {
                  const log = logs.find((l) => l.habitId === h.id && l.date === dateStr);
                  return isDayCompleted(h, log);
                }).length;

                const isFullyDone = totalScheduled > 0 && completedCount >= totalScheduled;
                const isPartiallyDone =
                  totalScheduled > 0 && completedCount > 0 && completedCount < totalScheduled;

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
                          : isToday
                          ? theme.surfaceHighlight
                          : theme.surface,
                        borderColor: isSelected
                          ? theme.accent
                          : isToday
                          ? `${theme.accent}60`
                          : theme.border,
                        transform: [{ scale: pressed ? 0.96 : 1 }],
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`${formatShortDay(dateStr)}, ${formatDayNumber(dateStr)}${
                      isToday ? ', Today' : ''
                    }${isSelected ? ', Selected' : ''}`}
                  >
                    <Text
                      style={[
                        styles.dayLabel,
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
                        styles.dayNumber,
                        {
                          color: isSelected ? '#FFFFFF' : theme.text,
                          fontWeight: isSelected ? '700' : '600',
                        },
                      ]}
                    >
                      {formatDayNumber(dateStr)}
                    </Text>

                    {/* Completion status dot */}
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
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: SPACING.xs,
    overflow: 'hidden',
  },
  scrollContent: {
    alignItems: 'center',
  },
  weekPage: {
    paddingHorizontal: 2,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 5,
  },
  dayCell: {
    flex: 1,
    minHeight: 64,
    borderRadius: RADII.md,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  dayLabel: {
    ...TYPOGRAPHY.tiny,
    fontSize: 12,
  },
  dayNumber: {
    ...TYPOGRAPHY.body,
    fontSize: 16,
    marginTop: 2,
  },
  statusDot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.25,
    marginTop: 4,
  },
});
