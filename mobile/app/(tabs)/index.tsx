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
import Animated, {
  LinearTransition,
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
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
import { CollapsibleHeader } from '../../components/CollapsibleHeader';
import { WeekStrip } from '../../components/WeekStrip';
import { ProgressRing } from '../../components/ProgressRing';
import { HabitCard } from '../../components/HabitCard';
import { HabitSheet } from '../../components/HabitSheet';
import { NumberInputModal } from '../../components/NumberInputModal';
import { RunningHabitTimer } from '../../components/RunningHabitTimer';
import { HabitDetailModal } from '../../components/HabitDetailModal';
import { Snackbar } from '../../components/Snackbar';
import { Celebration } from '../../components/Celebration';
import { EmptyState } from '../../components/EmptyState';
import { SPACING, RADII, TYPOGRAPHY } from '../../constants/theme';
import { triggerHaptic } from '../../services/haptics';

export default function TodayScreen() {
  const { theme } = useAppTheme();
  const selectedDate = useHabitStore((state) => state.selectedDate);
  const setSelectedDate = useHabitStore((state) => state.setSelectedDate);
  const jumpToToday = useHabitStore((state) => state.jumpToToday);

  const habits = useHabitStore((state) => state.habits);
  const logs = useHabitStore((state) => state.logs);
  const userName = useHabitStore((state) => state.settings.userName);
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
  const [timerHabit, setTimerHabit] = useState<Habit | null>(null);
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

  const handleCompleteHabit = (habit: Habit) => {
    const existingLog = logs.find((l) => l.habitId === habit.id && l.date === selectedDate);
    const isDone = isDayCompleted(habit, existingLog);
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

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const todayPillAction = !isTodayDate(selectedDate) ? (
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
      <Text style={[styles.todayPillText, { color: theme.accent }]}>Today</Text>
    </Pressable>
  ) : null;

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <Celebration
        visible={showCelebration}
        onDismiss={() => setShowCelebration(false)}
      />

      {/* Native-style Collapsible iOS Large Title Header */}
      <CollapsibleHeader
        title={formatHeaderDate(selectedDate)}
        subtitle={userName ? `${greeting}, ${userName}` : undefined}
        scrollY={scrollY}
        rightAction={todayPillAction}
      />

      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
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
        {/* Week-wise Horizontally Scrollable Strip */}
        <WeekStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />

        {/* Daily Summary Progress Card */}
        {totalCount > 0 && (
          <Animated.View
            layout={LinearTransition.springify().damping(22).stiffness(200)}
            style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <View style={styles.summaryTextWrap}>
              <Text style={[styles.summaryTitle, { color: theme.text }]}>
                {completedCount === totalCount
                  ? 'All Done for Today!'
                  : `${completedCount} of ${totalCount} habits done`}
              </Text>
              <Text style={[styles.summarySubtitle, { color: theme.textMuted }]}>
                {completedCount === totalCount
                  ? 'Great momentum. Your streaks are protected.'
                  : `${totalCount - completedCount} remaining today.`}
              </Text>
            </View>
            <ProgressRing completed={completedCount} total={totalCount} />
          </Animated.View>
        )}

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Today's habits</Text>
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
            <Text style={[styles.addTextBtnLabel, { color: theme.accent }]}>New habit</Text>
          </Pressable>
        </View>

        {/* Habits List with Layout Transition */}
        {scheduledHabits.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="No habits scheduled"
            description={
              habits.length === 0
                ? "You haven't added any habits yet. Start with a simple ritual."
                : 'No habits scheduled for this day.'
            }
            actionLabel="Add habit"
            onAction={() => {
              setEditingHabit(null);
              setSheetVisible(true);
            }}
          />
        ) : (
          <Animated.View layout={LinearTransition.springify().damping(22).stiffness(200)}>
            {scheduledHabits.map((habit, index) => {
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
                  onOpenTimer={() => setTimerHabit(habit)}
                  onSkip={() => skipHabit(habit.id, selectedDate)}
                  onArchive={() => archiveHabit(habit.id)}
                  onOpenDetail={() => setDetailHabit(habit)}
                />
              );
            })}
          </Animated.View>
        )}
      </Animated.ScrollView>

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

      {/* Running Live Timer for Time-Based Habits */}
      <RunningHabitTimer
        visible={!!timerHabit}
        habit={timerHabit}
        initialMinutes={
          logs.find((l) => l.habitId === timerHabit?.id && l.date === selectedDate)?.value || 0
        }
        onClose={() => setTimerHabit(null)}
        onFinish={(loggedMinutes) => {
          if (timerHabit) {
            logHabit(timerHabit.id, selectedDate, loggedMinutes);
          }
        }}
      />

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
    paddingBottom: 110,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: SPACING.sm,
  },
  dateCol: {
    flex: 1,
  },
  greetingText: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
    marginBottom: 2,
    fontWeight: '500',
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADII.sm,
  },
  todayPillText: {
    ...TYPOGRAPHY.tiny,
    fontSize: 12,
    fontWeight: '700',
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
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  sectionTitle: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
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
