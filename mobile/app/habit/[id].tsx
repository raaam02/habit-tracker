import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../constants/useAppTheme';
import { useHabitStore } from '../../store/habitStore';
import { computeStreakStats } from '../../utils/streaks';
import { YearlyHeatmap } from '../../components/YearlyHeatmap';
import { HabitSheet } from '../../components/HabitSheet';
import { getTodayDateString } from '../../utils/date';
import { SPACING, RADII, TYPOGRAPHY, TOUCH_TARGET } from '../../constants/theme';
import { triggerHaptic } from '../../services/haptics';

export default function HabitDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useAppTheme();

  const habits = useHabitStore((state) => state.habits);
  const logs = useHabitStore((state) => state.logs);
  const editHabit = useHabitStore((state) => state.editHabit);

  const [sheetVisible, setSheetVisible] = useState(false);

  const habit = habits.find((h) => h.id === id);

  if (!habit) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorTitle, { color: theme.text }]}>Habit Not Found</Text>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: theme.accent }]}
          >
            <Text style={styles.backBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const today = getTodayDateString();
  const stats = computeStreakStats(habit, logs, today);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            triggerHaptic.light();
            router.back();
          }}
          style={({ pressed }) => [
            styles.iconButton,
            { backgroundColor: pressed ? theme.surfaceHighlight : theme.surface },
          ]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </Pressable>

        <Pressable
          onPress={() => {
            triggerHaptic.light();
            setSheetVisible(true);
          }}
          style={({ pressed }) => [
            styles.iconButton,
            { backgroundColor: pressed ? theme.surfaceHighlight : theme.surface },
          ]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Edit habit"
        >
          <Ionicons name="pencil" size={18} color={theme.accent} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Habit Card Top */}
        <View style={[styles.cardTop, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.iconCircle, { backgroundColor: `${habit.color}25` }]}>
            <Ionicons name={habit.icon as any} size={28} color={habit.color} />
          </View>
          <Text style={[styles.name, { color: theme.text }]}>{habit.name}</Text>
          <Text style={[styles.schedule, { color: theme.textMuted }]}>
            {habit.type === 'check'
              ? 'Daily check-off'
              : `${habit.target} ${habit.type === 'minutes' ? 'mins' : 'reps'} target`}
          </Text>
        </View>

        {/* 4 Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.statIconRow}>
              <Ionicons
                name="flame"
                size={20}
                color={stats.isAtRisk ? theme.warning : '#F97316'}
              />
              {stats.isAtRisk && (
                <Text style={[styles.riskTag, { color: theme.warning }]}>At Risk</Text>
              )}
            </View>
            <Text style={[styles.statValue, { color: theme.text }]}>{stats.currentStreak}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Current Streak</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="trophy" size={20} color="#FBBF24" />
            <Text style={[styles.statValue, { color: theme.text }]}>{stats.bestStreak}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Best Streak</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="trending-up" size={20} color={theme.accent} />
            <Text style={[styles.statValue, { color: theme.text }]}>{stats.completionRate7d}%</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>7-Day Rate</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="calendar-outline" size={20} color={theme.success} />
            <Text style={[styles.statValue, { color: theme.text }]}>{stats.completionRate30d}%</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>30-Day Rate</Text>
          </View>
        </View>

        {/* Heatmap */}
        <YearlyHeatmap habits={[habit]} logs={logs} specificHabitId={habit.id} />
      </ScrollView>

      {/* Edit Sheet */}
      <HabitSheet
        visible={sheetVisible}
        habitToEdit={habit}
        onClose={() => setSheetVisible(false)}
        onSave={(data) => {
          editHabit(habit.id, data);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingTop: Platform.OS === 'android' ? SPACING.xl : SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.base,
    paddingBottom: 40,
  },
  cardTop: {
    alignItems: 'center',
    padding: SPACING.xl,
    borderRadius: RADII.card,
    borderWidth: 1,
    marginVertical: SPACING.md,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  name: {
    ...TYPOGRAPHY.title2,
    fontSize: 22,
    textAlign: 'center',
  },
  schedule: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  statBox: {
    flex: 1,
    minWidth: '46%',
    padding: SPACING.md,
    borderRadius: RADII.card,
    borderWidth: 1,
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  riskTag: {
    ...TYPOGRAPHY.tiny,
    fontSize: 10,
    fontWeight: '700',
  },
  statValue: {
    ...TYPOGRAPHY.title1,
    fontSize: 26,
    marginVertical: 4,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  errorTitle: {
    ...TYPOGRAPHY.title2,
    marginBottom: SPACING.base,
  },
  backBtn: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADII.card,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
