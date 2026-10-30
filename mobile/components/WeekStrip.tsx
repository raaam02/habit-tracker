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
  getTodayDateString,
  daysBetween,
} from '../utils/date';
import { triggerHaptic } from '../services/haptics';
import { SPACING, RADII, TYPOGRAPHY } from '../constants/theme';
import { isDayCompleted, isDayScheduled } from '../utils/streaks';

interface WeekStripProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

const WEEKS_BEFORE = 20;
const WEEKS_AFTER = 20;
const TOTAL_WEEKS = WEEKS_BEFORE + WEEKS_AFTER + 1; // 41 weeks
const CENTER_INDEX = WEEKS_BEFORE; // 20

export const WeekStrip: React.FC<WeekStripProps> = ({ selectedDate, onSelectDate }) => {
  const { theme } = useAppTheme();
  const weekStartDay = useHabitStore((state) => state.settings.weekStartDay);
  const habits = useHabitStore((state) => state.habits);
  const logs = useHabitStore((state) => state.logs);

  const scrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const [containerWidth, setContainerWidth] = useState(
    Math.min(Dimensions.get('window').width - SPACING.base * 2, 520)
  );

  const today = useMemo(() => getTodayDateString(), []);

  // Stable weeks array anchored around today
  const weeksData = useMemo(() => {
    return Array.from({ length: TOTAL_WEEKS }, (_, i) => {
      const offsetWeeks = i - CENTER_INDEX;
      const anchor = shiftDateString(today, offsetWeeks * 7);
      return {
        index: i,
        offsetWeeks,
        dates: getWeekDates(anchor, weekStartDay),
      };
    });
  }, [today, weekStartDay]);

  // Determine week index for any date
  const getWeekIndexForDate = (targetDate: string): number => {
    const targetWeekFirstDay = getWeekDates(targetDate, weekStartDay)[0];
    const centerWeekFirstDay = getWeekDates(today, weekStartDay)[0];
    const diffDays = daysBetween(centerWeekFirstDay, targetWeekFirstDay);
    const diffWeeks = Math.round(diffDays / 7);
    const index = CENTER_INDEX + diffWeeks;
    return Math.max(0, Math.min(TOTAL_WEEKS - 1, index));
  };

  const currentWeekIndex = getWeekIndexForDate(selectedDate);
  const isInitialMount = useRef(true);

  // Initial scroll and animated scroll on date change
  useEffect(() => {
    if (!scrollRef.current || containerWidth <= 0) return;

    if (isInitialMount.current) {
      scrollRef.current.scrollTo({
        x: currentWeekIndex * containerWidth,
        animated: false,
      });
      isInitialMount.current = false;
    } else {
      scrollRef.current.scrollTo({
        x: currentWeekIndex * containerWidth,
        animated: true,
      });
    }
  }, [currentWeekIndex, containerWidth]);

  const handleLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 0 && Math.abs(width - containerWidth) > 1) {
      setContainerWidth(width);
    }
  };

  const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / containerWidth);

    if (page >= 0 && page < weeksData.length && page !== currentWeekIndex) {
      triggerHaptic.selection();
      const targetWeekDates = weeksData[page].dates;
      const currentWeekDates = weeksData[currentWeekIndex]?.dates || [];
      const dayOfWeekIndex = currentWeekDates.indexOf(selectedDate);

      const newSelectedDate =
        dayOfWeekIndex >= 0 && dayOfWeekIndex < targetWeekDates.length
          ? targetWeekDates[dayOfWeekIndex]
          : targetWeekDates[0];

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
          <View key={week.index} style={[styles.weekPage, { width: containerWidth }]}>
            <View style={styles.daysContainer}>
              {week.dates.map((dateStr) => {
                const isSelected = dateStr === selectedDate;
                const isToday = isTodayDate(dateStr);

                // Compute completion status for date
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
                          ? theme.borderLight
                          : theme.border,
                        transform: [{ scale: pressed ? 0.95 : 1 }],
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`${dateStr}${isSelected ? ', selected' : ''}${
                      isToday ? ', today' : ''
                    }`}
                  >
                    <Text
                      style={[
                        styles.shortDayText,
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
                        styles.dayNumberText,
                        {
                          color: isSelected
                            ? '#FFFFFF'
                            : isToday
                            ? theme.text
                            : theme.textMuted,
                          fontWeight: isSelected ? '700' : isToday ? '600' : '400',
                        },
                      ]}
                    >
                      {formatDayNumber(dateStr)}
                    </Text>

                    {/* Completion Status Dot */}
                    <View style={styles.dotContainer}>
                      {isFullyDone ? (
                        <View style={[styles.statusDot, { backgroundColor: isSelected ? '#FFFFFF' : theme.success }]} />
                      ) : isPartiallyDone ? (
                        <View style={[styles.statusDot, { backgroundColor: isSelected ? 'rgba(255,255,255,0.7)' : theme.warning }]} />
                      ) : (
                        <View style={[styles.statusDotPlaceholder]} />
                      )}
                    </View>
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
    marginVertical: SPACING.sm,
    width: '100%',
  },
  scrollContent: {
    flexDirection: 'row',
  },
  weekPage: {
    paddingHorizontal: 2,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: RADII.md,
    borderWidth: 1,
    minHeight: 64,
  },
  shortDayText: {
    ...TYPOGRAPHY.tiny,
    fontSize: 11,
    marginBottom: 3,
  },
  dayNumberText: {
    ...TYPOGRAPHY.headline,
    fontSize: 15,
  },
  dotContainer: {
    height: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  statusDotPlaceholder: {
    width: 4,
    height: 4,
  },
});
