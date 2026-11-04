import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { useAppTheme } from '../../constants/useAppTheme';
import { useHabitStore } from '../../store/habitStore';
import { Habit } from '../../types/habit';
import { computeStreakStats } from '../../utils/streaks';
import { CollapsibleHeader } from '../../components/CollapsibleHeader';
import { YearlyHeatmap } from '../../components/YearlyHeatmap';
import { WeeklyBarChart } from '../../components/WeeklyBarChart';
import { HabitDetailModal } from '../../components/HabitDetailModal';
import { HabitSheet } from '../../components/HabitSheet';
import { EmptyState } from '../../components/EmptyState';
import { StatCard } from '../../components/StatCard';
import { HabitPerformanceRow } from '../../components/HabitPerformanceRow';
import { getTodayDateString } from '../../utils/date';
import { SPACING, TYPOGRAPHY } from '../../constants/theme';

export default function StatsScreen() {
  const { theme } = useAppTheme();
  const habits = useHabitStore((state) => state.habits);
  const logs = useHabitStore((state) => state.logs);
  const editHabit = useHabitStore((state) => state.editHabit);

  const [detailHabit, setDetailHabit] = useState<Habit | null>(null);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const today = getTodayDateString();
  const activeHabits = habits.filter((h) => !h.archivedAt);

  // Compute aggregate stats across all active habits
  const aggregateStats = useMemo(() => {
    if (activeHabits.length === 0) {
      return {
        highestCurrentStreak: 0,
        highestBestStreak: 0,
        avg7dRate: 0,
        avg30dRate: 0,
        totalLogs: logs.length,
      };
    }

    let highestCurrent = 0;
    let highestBest = 0;
    let sum7d = 0;
    let sum30d = 0;

    for (const h of activeHabits) {
      const s = computeStreakStats(h, logs, today);
      if (s.currentStreak > highestCurrent) highestCurrent = s.currentStreak;
      if (s.bestStreak > highestBest) highestBest = s.bestStreak;
      sum7d += s.completionRate7d;
      sum30d += s.completionRate30d;
    }

    return {
      highestCurrentStreak: highestCurrent,
      highestBestStreak: highestBest,
      avg7dRate: Math.round(sum7d / activeHabits.length),
      avg30dRate: Math.round(sum30d / activeHabits.length),
      totalLogs: logs.length,
    };
  }, [activeHabits, logs, today]);

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Native-style Collapsible iOS Large Title Header */}
      <CollapsibleHeader
        title="Analytics"
        subtitle="Consistency compounds over time"
        scrollY={scrollY}
      />

      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {activeHabits.length === 0 ? (
          <EmptyState
            icon="bar-chart-outline"
            title="No Habit Stats Yet"
            description="Create your first habit to start tracking streaks, completion heatmaps, and weekly momentum."
          />
        ) : (
          <>
            {/* 4 Aggregate Streak Cards */}
            <View style={styles.grid}>
              <StatCard
                icon="flame"
                iconColor="#F97316"
                value={aggregateStats.highestCurrentStreak}
                label="Active Streak (Peak)"
              />
              <StatCard
                icon="trophy"
                iconColor="#FBBF24"
                value={aggregateStats.highestBestStreak}
                label="All-Time Best Streak"
              />
              <StatCard
                icon="trending-up"
                iconColor={theme.accent}
                value={`${aggregateStats.avg7dRate}%`}
                label="7-Day Average"
              />
              <StatCard
                icon="calendar"
                iconColor={theme.success}
                value={`${aggregateStats.avg30dRate}%`}
                label="30-Day Average"
              />
            </View>

            {/* GitHub-style Heatmap */}
            <YearlyHeatmap habits={activeHabits} logs={logs} />

            {/* Weekly Completion Bar Chart */}
            <WeeklyBarChart selectedDate={today} />

            {/* Habit Performance Drilldown List */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
                Habit Performance Drilldown
              </Text>
            </View>

            {activeHabits.map((habit) => (
              <HabitPerformanceRow
                key={habit.id}
                habit={habit}
                logs={logs}
                date={today}
                onPress={() => setDetailHabit(habit)}
              />
            ))}
          </>
        )}
      </Animated.ScrollView>

      {/* Habit Detail Modal */}
      <HabitDetailModal
        visible={!!detailHabit}
        habit={detailHabit}
        onClose={() => setDetailHabit(null)}
        onEdit={(habit) => {
          setEditingHabit(habit);
          setSheetVisible(true);
        }}
      />

      {/* Edit Habit Sheet */}
      <HabitSheet
        visible={sheetVisible}
        habitToEdit={editingHabit}
        onClose={() => {
          setSheetVisible(false);
          setEditingHabit(null);
        }}
        onSave={(data) => {
          if (editingHabit) {
            editHabit(editingHabit.id, data);
            setEditingHabit(null);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.sm,
    paddingBottom: 90,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  sectionHeader: {
    marginTop: SPACING.base,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
