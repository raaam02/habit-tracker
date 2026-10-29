import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../constants/useAppTheme';
import { useHabitStore } from '../../store/habitStore';
import { Habit } from '../../types/habit';
import { computeStreakStats } from '../../utils/streaks';
import { YearlyHeatmap } from '../../components/YearlyHeatmap';
import { WeeklyBarChart } from '../../components/WeeklyBarChart';
import { HabitDetailModal } from '../../components/HabitDetailModal';
import { HabitSheet } from '../../components/HabitSheet';
import { EmptyState } from '../../components/EmptyState';
import { getTodayDateString } from '../../utils/date';
import { SPACING, RADII, TYPOGRAPHY, TOUCH_TARGET } from '../../constants/theme';
import { triggerHaptic } from '../../services/haptics';

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

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Analytics & Streaks</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Consistency compounds over time.
          </Text>
        </View>

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
              <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.iconRow}>
                  <Ionicons name="flame" size={22} color="#F97316" />
                </View>
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {aggregateStats.highestCurrentStreak}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>
                  Active Streak (Peak)
                </Text>
              </View>

              <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.iconRow}>
                  <Ionicons name="trophy" size={22} color="#FBBF24" />
                </View>
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {aggregateStats.highestBestStreak}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>
                  All-Time Best Streak
                </Text>
              </View>

              <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.iconRow}>
                  <Ionicons name="trending-up" size={22} color={theme.accent} />
                </View>
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {aggregateStats.avg7dRate}%
                </Text>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>
                  7-Day Average
                </Text>
              </View>

              <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.iconRow}>
                  <Ionicons name="calendar" size={22} color={theme.success} />
                </View>
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {aggregateStats.avg30dRate}%
                </Text>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>
                  30-Day Average
                </Text>
              </View>
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

            {activeHabits.map((habit) => {
              const stats = computeStreakStats(habit, logs, today);

              return (
                <Pressable
                  key={habit.id}
                  onPress={() => {
                    triggerHaptic.light();
                    setDetailHabit(habit);
                  }}
                  style={({ pressed }) => [
                    styles.habitRow,
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

                  <View style={styles.habitRowContent}>
                    <Text style={[styles.habitRowName, { color: theme.text }]} numberOfLines={1}>
                      {habit.name}
                    </Text>
                    <Text style={[styles.habitRowMeta, { color: theme.textMuted }]}>
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
            })}
          </>
        )}
      </ScrollView>

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
    </SafeAreaView>
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
    paddingTop: Platform.OS === 'android' ? SPACING.xl : SPACING.sm,
    paddingBottom: 90,
  },
  header: {
    marginBottom: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.title1,
    fontSize: 28,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    fontSize: 14,
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  card: {
    flex: 1,
    minWidth: '46%',
    padding: SPACING.md,
    borderRadius: RADII.card,
    borderWidth: 1,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statValue: {
    ...TYPOGRAPHY.title1,
    fontSize: 26,
    fontWeight: '700',
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    marginTop: 2,
  },
  sectionHeader: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  sectionTitle: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.base,
    borderRadius: RADII.card,
    borderWidth: 1,
    marginVertical: 4,
    minHeight: 64,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  habitRowContent: {
    flex: 1,
  },
  habitRowName: {
    ...TYPOGRAPHY.headline,
    fontSize: 15,
  },
  habitRowMeta: {
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
    fontSize: 15,
    fontWeight: '700',
  },
  atRiskPill: {
    ...TYPOGRAPHY.tiny,
    fontSize: 9,
    fontWeight: '700',
  },
});
