import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../constants/useAppTheme';
import { useHabitStore } from '../../store/habitStore';
import { Habit, HabitLog } from '../../types/habit';
import {
  formatHeaderDate,
  shiftDateString,
  isTodayDate,
  getTodayDateString,
} from '../../utils/date';
import { computeStreakStats, isDayCompleted, isDayScheduled } from '../../utils/streaks';
import { WeekStrip } from '../../components/WeekStrip';
import { ProgressRing } from '../../components/ProgressRing';
import { HabitCard } from '../../components/HabitCard';
import { HabitSheet } from '../../components/HabitSheet';
import { NumberInputModal } from '../../components/NumberInputModal';
import { HabitDetailModal } from '../../components/HabitDetailModal';
import { Snackbar } from '../../components/Snackbar';
import { Celebration } from '../../components/Celebration';
import { EmptyState } from '../../components/EmptyState';
import { SPACING, RADII, TYPOGRAPHY, TOUCH_TARGET } from '../../constants/theme';
import { triggerHaptic } from '../../services/haptics';

export default function TodayScreen() {
  const { theme } = useAppTheme();
  const selectedDate = useHabitStore((state) => state.selectedDate);
  const setSelectedDate = useHabitStore((state) => state.setSelectedDate);
  const jumpToToday = useHabitStore((state) => state.jumpToToday);

  const habits = useHabitStore((state) => state.habits);
  const logs = useHabitStore((state) => state.logs);
  const addHabit = useHabitStore((state) => state.addHabit);
  const editHabit = useHabitStore((state) => state.editHabit);
  const archiveHabit = useHabitStore((state) => state.archiveHabit);
  const logHabit = useHabitStore((state) => state.logHabit);
  const incrementHabit = useHabitStore((state) => state.incrementHabit);
  const skipHabit = useHabitStore((state) => state.skipHabit);

  // Modal states
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [numberModalHabit, setNumberModalHabit] = useState<Habit | null>(null);
  const [detailHabit, setDetailHabit] = useState<Habit | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [hasCelebratedForDate, setHasCelebratedForDate] = useState<string | null>(null);

  // Habits scheduled for selected date
  const scheduledHabits = useMemo(() => {
    return habits
      .filter((h) => !h.archivedAt && isDayScheduled(h, selectedDate))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [habits, selectedDate]);

  // Compute daily progress
  const completedCount = useMemo(() => {
    return scheduledHabits.filter((h) => {
      const log = logs.find((l) => l.habitId === h.id && l.date === selectedDate);
      return isDayCompleted(h, log);
    }).length;
  }, [scheduledHabits, logs, selectedDate]);

  const totalCount = scheduledHabits.length;

  // Trigger celebration when all habits completed for selected date
  useEffect(() => {
    if (totalCount > 0 && completedCount === totalCount) {
      if (hasCelebratedForDate !== selectedDate) {
        setShowCelebration(true);
        setHasCelebratedForDate(selectedDate);
      }
    }
  }, [completedCount, totalCount, selectedDate, hasCelebratedForDate]);

  const handlePrevDay = () => {
    triggerHaptic.selection();
    setSelectedDate(shiftDateString(selectedDate, -1));
  };

  const handleNextDay = () => {
    triggerHaptic.selection();
    setSelectedDate(shiftDateString(selectedDate, 1));
  };

  const handleCompleteHabit = (habit: Habit) => {
    const existingLog = logs.find((l) => l.habitId === habit.id && l.date === selectedDate);
    const isDone = isDayCompleted(habit, existingLog);
    // If done, uncomplete to 0; if not, complete to target
    const nextVal = isDone ? 0 : habit.target;
    logHabit(habit.id, selectedDate, nextVal, existingLog?.note);
  };

  const handleCreateOrEdit = (
    data: Omit<Habit, 'id' | 'createdAt' | 'sortOrder'>
  ) => {
    if (editingHabit) {
      editHabit(editingHabit.id, data);
      setEditingHabit(null);
    } else {
      addHabit(data);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <Celebration
        visible={showCelebration}
        onDismiss={() => setShowCelebration(false)}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {
              triggerHaptic.medium();
              jumpToToday();
            }}
            tintColor={theme.accent}
          />
        }
      >
        {/* Date Header & Jump to Today */}
        <View style={styles.headerRow}>
          <View style={styles.dateCol}>
            <Text style={[styles.dateTitle, { color: theme.text }]}>
              {formatHeaderDate(selectedDate)}
            </Text>
            {!isTodayDate(selectedDate) && (
              <Pressable
                onPress={() => {
                  triggerHaptic.light();
                  jumpToToday();
                }}
                style={({ pressed }) => [
                  styles.todayPill,
                  { backgroundColor: pressed ? theme.surfaceHighlight : theme.accentMuted },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Jump to today"
              >
                <Ionicons name="return-down-back" size={13} color={theme.accent} />
                <Text style={[styles.todayPillText, { color: theme.accent }]}>Back to Today</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.headerArrows}>
            <Pressable
              onPress={handlePrevDay}
              style={({ pressed }) => [
                styles.arrowBtn,
                { backgroundColor: pressed ? theme.surfaceHighlight : theme.surface },
              ]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Previous day"
            >
              <Ionicons name="chevron-back" size={20} color={theme.text} />
            </Pressable>
            <Pressable
              onPress={handleNextDay}
              style={({ pressed }) => [
                styles.arrowBtn,
                { backgroundColor: pressed ? theme.surfaceHighlight : theme.surface },
              ]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Next day"
            >
              <Ionicons name="chevron-forward" size={20} color={theme.text} />
            </Pressable>
          </View>
        </View>

        {/* Horizontal Week Strip */}
        <WeekStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />

        {/* Daily Summary Progress Card */}
        {totalCount > 0 && (
          <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.summaryTextWrap}>
              <Text style={[styles.summaryTitle, { color: theme.text }]}>
                {completedCount === totalCount
                  ? 'All Done for Today!'
                  : `${completedCount} of ${totalCount} habits done`}
              </Text>
              <Text style={[styles.summarySubtitle, { color: theme.textMuted }]}>
                {completedCount === totalCount
                  ? 'Great discipline! Your streaks are locked in.'
                  : `${totalCount - completedCount} remaining to keep streaks thriving.`}
              </Text>
            </View>
            <ProgressRing completed={completedCount} total={totalCount} />
          </View>
        )}

        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Today's Habits</Text>
          <Pressable
            onPress={() => {
              triggerHaptic.light();
              setEditingHabit(null);
              setSheetVisible(true);
            }}
            style={({ pressed }) => [
              styles.addTextBtn,
              { backgroundColor: pressed ? theme.surfaceHighlight : 'transparent' },
            ]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Add new habit"
          >
            <Ionicons name="add" size={18} color={theme.accent} />
            <Text style={[styles.addTextBtnLabel, { color: theme.accent }]}>New Habit</Text>
          </Pressable>
        </View>

        {/* Habits List */}
        {scheduledHabits.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="No Habits Scheduled"
            description={
              habits.length === 0
                ? "You haven't added any habits yet. Start small and build momentum!"
                : 'No habits scheduled for this day of the week.'
            }
            actionLabel="Add Habit"
            onAction={() => {
              setEditingHabit(null);
              setSheetVisible(true);
            }}
          />
        ) : (
          scheduledHabits.map((habit, index) => {
            const habitLog = logs.find((l) => l.habitId === habit.id && l.date === selectedDate);
            const streakStats = computeStreakStats(habit, logs, selectedDate);

            return (
              <HabitCard
                key={habit.id}
                habit={habit}
                log={habitLog}
                streakStats={streakStats}
                date={selectedDate}
                isFirstRow={index === 0}
                onComplete={() => handleCompleteHabit(habit)}
                onIncrement={() => incrementHabit(habit.id, selectedDate, 1)}
                onOpenNumberInput={() => setNumberModalHabit(habit)}
                onSkip={() => skipHabit(habit.id, selectedDate)}
                onEdit={() => {
                  setEditingHabit(habit);
                  setSheetVisible(true);
                }}
                onArchive={() => archiveHabit(habit.id)}
                onOpenDetail={() => setDetailHabit(habit)}
              />
            );
          })
        )}
      </ScrollView>

      {/* 5-second Undo Toast */}
      <Snackbar />

      {/* Add / Edit Sheet */}
      <HabitSheet
        visible={sheetVisible}
        habitToEdit={editingHabit}
        onClose={() => {
          setSheetVisible(false);
          setEditingHabit(null);
        }}
        onSave={handleCreateOrEdit}
      />

      {/* Number / Minutes Input Modal */}
      <NumberInputModal
        visible={!!numberModalHabit}
        habit={numberModalHabit}
        currentValue={
          logs.find((l) => l.habitId === numberModalHabit?.id && l.date === selectedDate)?.value || 0
        }
        onClose={() => setNumberModalHabit(null)}
        onSave={(newVal) => {
          if (numberModalHabit) {
            logHabit(numberModalHabit.id, selectedDate, newVal);
          }
        }}
      />

      {/* Habit Detail Drilldown Modal */}
      <HabitDetailModal
        visible={!!detailHabit}
        habit={detailHabit}
        onClose={() => setDetailHabit(null)}
        onEdit={(habit) => {
          setEditingHabit(habit);
          setSheetVisible(true);
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
    paddingBottom: 110, // room for tab bar & snackbar
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  dateCol: {
    flex: 1,
  },
  dateTitle: {
    ...TYPOGRAPHY.title1,
    fontSize: 28,
    fontWeight: '700',
  },
  todayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADII.sm,
    marginTop: 4,
  },
  todayPillText: {
    ...TYPOGRAPHY.tiny,
    fontSize: 11,
    fontWeight: '700',
  },
  headerArrows: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  arrowBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.base,
    borderRadius: RADII.card,
    borderWidth: 1,
    marginVertical: SPACING.md,
  },
  summaryTextWrap: {
    flex: 1,
    marginRight: SPACING.base,
  },
  summaryTitle: {
    ...TYPOGRAPHY.headline,
    fontSize: 17,
  },
  summarySubtitle: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  sectionTitle: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addTextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADII.sm,
  },
  addTextBtnLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
  },
});
