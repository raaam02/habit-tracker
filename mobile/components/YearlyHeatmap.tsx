import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { HabitLog, Habit } from '../types/habit';
import { useAppTheme } from '../constants/useAppTheme';
import {
  shiftDateString,
  getTodayDateString,
  getWeekday,
  parseLocalDate,
  formatHeaderDate,
} from '../utils/date';
import { SPACING, RADII, TYPOGRAPHY } from '../constants/theme';
import { isDayCompleted, isDayScheduled } from '../utils/streaks';

interface YearlyHeatmapProps {
  habits: Habit[];
  logs: HabitLog[];
  specificHabitId?: string; // If specified, renders heatmap for just this habit
}

export const YearlyHeatmap: React.FC<YearlyHeatmapProps> = ({
  habits,
  logs,
  specificHabitId,
}) => {
  const { theme } = useAppTheme();
  const [selectedCell, setSelectedCell] = useState<{
    date: string;
    completed: number;
    total: number;
  } | null>(null);

  const today = getTodayDateString();
  const numWeeks = 24; // Show last ~6 months of continuous heatmap data
  const cellSize = 13;
  const cellGap = 3;
  const totalDays = numWeeks * 7;

  // Calculate starting date (a Sunday numWeeks ago)
  const todayWeekday = getWeekday(today);
  const startOffset = totalDays - (7 - todayWeekday);
  const startDate = shiftDateString(today, -startOffset);

  // Group completions by date
  const dayStatsMap = new Map<string, { completed: number; total: number }>();

  // Filter habits if specificHabitId given
  const activeHabits = specificHabitId
    ? habits.filter((h) => h.id === specificHabitId)
    : habits.filter((h) => !h.archivedAt);

  let curDate = startDate;
  while (curDate <= today) {
    let completed = 0;
    let scheduled = 0;

    for (const habit of activeHabits) {
      if (isDayScheduled(habit, curDate)) {
        scheduled++;
        const log = logs.find((l) => l.habitId === habit.id && l.date === curDate);
        if (isDayCompleted(habit, log)) {
          completed++;
        }
      }
    }

    dayStatsMap.set(curDate, { completed, total: scheduled });
    curDate = shiftDateString(curDate, 1);
  }

  // Build grid of weeks
  const weeks: { weekIndex: number; days: { date: string; dayOfWeek: number }[] }[] = [];
  let runnerDate = startDate;

  for (let w = 0; w < numWeeks; w++) {
    const daysInWeek: { date: string; dayOfWeek: number }[] = [];
    for (let d = 0; d < 7; d++) {
      if (runnerDate <= today) {
        daysInWeek.push({
          date: runnerDate,
          dayOfWeek: d,
        });
      }
      runnerDate = shiftDateString(runnerDate, 1);
    }
    weeks.push({ weekIndex: w, days: daysInWeek });
  }

  const getCellColor = (dateStr: string) => {
    const stats = dayStatsMap.get(dateStr);
    if (!stats || stats.total === 0 || stats.completed === 0) {
      return theme.surfaceHighlight;
    }
    const ratio = stats.completed / stats.total;
    if (ratio === 1) return theme.success;
    if (ratio >= 0.5) return `${theme.success}99`;
    return `${theme.success}55`;
  };

  const svgWidth = numWeeks * (cellSize + cellGap) + 36;
  const svgHeight = 7 * (cellSize + cellGap) + 24;

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.text }]}>Activity Heatmap</Text>
        {selectedCell && (
          <Text style={[styles.cellInfo, { color: theme.accent }]}>
            {selectedCell.date}: {selectedCell.completed}/{selectedCell.total} done
          </Text>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        <Svg width={svgWidth} height={svgHeight}>
          {weeks.map((week) => {
            const x = week.weekIndex * (cellSize + cellGap) + 24;
            return week.days.map((day) => {
              const y = day.dayOfWeek * (cellSize + cellGap) + 16;
              const color = getCellColor(day.date);
              return (
                <Rect
                  key={day.date}
                  x={x}
                  y={y}
                  width={cellSize}
                  height={cellSize}
                  rx={2.5}
                  ry={2.5}
                  fill={color}
                  onPress={() => {
                    const stats = dayStatsMap.get(day.date) || { completed: 0, total: 0 };
                    setSelectedCell({
                      date: day.date,
                      completed: stats.completed,
                      total: stats.total,
                    });
                  }}
                />
              );
            });
          })}
        </Svg>
      </ScrollView>

      {/* Legend */}
      <View style={styles.legendRow}>
        <Text style={[styles.legendText, { color: theme.textSubtle }]}>Less</Text>
        <View style={[styles.legendBox, { backgroundColor: theme.surfaceHighlight }]} />
        <View style={[styles.legendBox, { backgroundColor: `${theme.success}55` }]} />
        <View style={[styles.legendBox, { backgroundColor: `${theme.success}99` }]} />
        <View style={[styles.legendBox, { backgroundColor: theme.success }]} />
        <Text style={[styles.legendText, { color: theme.textSubtle }]}>More</Text>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.headline,
    fontSize: 16,
  },
  cellInfo: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
  },
  scroll: {
    marginVertical: SPACING.xs,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: SPACING.xs,
  },
  legendBox: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendText: {
    ...TYPOGRAPHY.tiny,
    fontSize: 10,
    marginHorizontal: 2,
  },
});
