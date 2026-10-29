import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  runOnJS,
  interpolate,
  Extrapolation,
  LinearTransition,
} from 'react-native-reanimated';
import { Habit, HabitLog, StreakStats } from '../types/habit';
import { useAppTheme } from '../constants/useAppTheme';
import { useHabitStore } from '../store/habitStore';
import { triggerHaptic } from '../services/haptics';
import { SPACING, RADII, TYPOGRAPHY, SPRING_CONFIG } from '../constants/theme';
import { isDayCompleted, isDaySkipped } from '../utils/streaks';

interface HabitCardProps {
  habit: Habit;
  log?: HabitLog;
  streakStats: StreakStats;
  date: string;
  isFirstRow?: boolean;
  onComplete: () => void;
  onIncrement: () => void;
  onOpenNumberInput: () => void;
  onSkip: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onOpenDetail: () => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  log,
  streakStats,
  date,
  isFirstRow = false,
  onComplete,
  onIncrement,
  onOpenNumberInput,
  onSkip,
  onEdit,
  onArchive,
  onOpenDetail,
}) => {
  const { theme } = useAppTheme();
  const settings = useHabitStore((state) => state.settings);
  const updateSettings = useHabitStore((state) => state.updateSettings);

  const isDone = isDayCompleted(habit, log);
  const isSkipped = isDaySkipped(log);
  const currentValue = log?.value || 0;

  const translateX = useSharedValue(0);
  const pressScale = useSharedValue(1);

  // Subtle first-run swipe hint
  useEffect(() => {
    if (isFirstRow && !settings.hasSeenSwipeHint) {
      const timer = setTimeout(() => {
        translateX.value = withSequence(
          withTiming(36, { duration: 300 }),
          withTiming(0, { duration: 250 }, (finished) => {
            if (finished) {
              runOnJS(updateSettings)({ hasSeenSwipeHint: true });
            }
          })
        );
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isFirstRow, settings.hasSeenSwipeHint]);

  const fireComplete = () => {
    triggerHaptic.success();
    onComplete();
  };

  // Fluid iOS-style pan gesture: smooth resistance, no jitter, velocity handoff
  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      'worklet';
      if (event.translationX > 0) {
        // Right swipe: soft rubber-band resistance past 70px
        translateX.value =
          event.translationX > 70
            ? 70 + (event.translationX - 70) * 0.3
            : event.translationX;
      } else {
        // Left swipe: soft rubber-band resistance past -130px
        translateX.value =
          event.translationX < -130
            ? -130 + (event.translationX + 130) * 0.3
            : event.translationX;
      }
    })
    .onEnd((event) => {
      'worklet';
      const swipeDistance = event.translationX;
      const velocity = event.velocityX;

      if (swipeDistance > 60 || velocity > 400) {
        // Right swipe threshold met -> complete habit with subtle spring
        runOnJS(fireComplete)();
        translateX.value = settings.reduceMotion
          ? withTiming(0, { duration: 150 })
          : withSpring(0, { ...SPRING_CONFIG, velocity });
      } else if (swipeDistance < -75 || velocity < -400) {
        // Snap open action drawer cleanly
        translateX.value = settings.reduceMotion
          ? withTiming(-136, { duration: 150 })
          : withSpring(-136, { ...SPRING_CONFIG, velocity });
      } else {
        // Smoothly settle back
        translateX.value = settings.reduceMotion
          ? withTiming(0, { duration: 150 })
          : withSpring(0, { ...SPRING_CONFIG, velocity });
      }
    });

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { scale: pressScale.value }],
  }));

  // Smooth swipe-right color fill
  const rightSwipeStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [0, 50], [0, 1], Extrapolation.CLAMP);
    return {
      opacity,
      backgroundColor: habit.color,
    };
  });

  // Action drawer visibility
  const leftSwipeStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [-15, -60], [0, 1], Extrapolation.CLAMP);
    return {
      opacity,
    };
  });

  const handlePressIn = () => {
    pressScale.value = withTiming(0.985, { duration: 100 });
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, SPRING_CONFIG);
  };

  const handleCardPress = () => {
    if (habit.type === 'count') {
      triggerHaptic.light();
      onIncrement();
    } else if (habit.type === 'minutes') {
      triggerHaptic.light();
      onOpenNumberInput();
    } else {
      triggerHaptic.light();
      onComplete();
    }
  };

  const handleCardLongPress = () => {
    triggerHaptic.medium();
    if (habit.type === 'count' || habit.type === 'minutes') {
      onOpenNumberInput();
    } else {
      onOpenDetail();
    }
  };

  const handleResetSwipe = () => {
    translateX.value = withSpring(0, SPRING_CONFIG);
  };

  return (
    <Animated.View layout={LinearTransition.springify().damping(22).stiffness(200)} style={styles.outerContainer}>
      {/* Background layer for Swipe Right (Complete) */}
      <Animated.View style={[styles.completeBackground, rightSwipeStyle]}>
        <View style={styles.completeIconWrap}>
          <Ionicons name="checkmark-circle" size={26} color="#FFFFFF" />
          <Text style={styles.completeActionText}>Done</Text>
        </View>
      </Animated.View>

      {/* Background layer for Swipe Left (Actions) */}
      <Animated.View style={[styles.actionsBackground, leftSwipeStyle]}>
        <Pressable
          onPress={() => {
            handleResetSwipe();
            triggerHaptic.light();
            onSkip();
          }}
          style={({ pressed }) => [
            styles.actionBtn,
            { backgroundColor: pressed ? theme.surfaceHighlight : theme.elevated },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Skip habit today"
        >
          <Ionicons name="play-forward" size={17} color={theme.textMuted} />
          <Text style={[styles.actionBtnLabel, { color: theme.textMuted }]}>Skip</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            handleResetSwipe();
            triggerHaptic.light();
            onEdit();
          }}
          style={({ pressed }) => [
            styles.actionBtn,
            { backgroundColor: pressed ? theme.surfaceHighlight : theme.elevated },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Edit habit"
        >
          <Ionicons name="pencil" size={17} color={theme.accent} />
          <Text style={[styles.actionBtnLabel, { color: theme.accent }]}>Edit</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            handleResetSwipe();
            triggerHaptic.medium();
            onArchive();
          }}
          style={({ pressed }) => [
            styles.actionBtn,
            { backgroundColor: pressed ? theme.surfaceHighlight : theme.elevated },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Archive habit"
        >
          <Ionicons name="archive" size={17} color={theme.danger} />
          <Text style={[styles.actionBtnLabel, { color: theme.danger }]}>Archive</Text>
        </Pressable>
      </Animated.View>

      {/* Foreground Card */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: isDone ? theme.surfaceHighlight : theme.surface,
              borderColor: isDone ? `${habit.color}60` : theme.border,
            },
            cardAnimatedStyle,
          ]}
        >
          <Pressable
            onPress={handleCardPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onLongPress={handleCardLongPress}
            delayLongPress={280}
            style={styles.cardContent}
            accessibilityRole="button"
            accessibilityLabel={`${habit.name}, target ${habit.target}. Status: ${
              isDone ? 'Completed' : isSkipped ? 'Skipped' : 'Incomplete'
            }. Current streak ${streakStats.currentStreak}`}
          >
            {/* Habit Icon circle */}
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: isDone ? habit.color : `${habit.color}18`,
                },
              ]}
            >
              <Ionicons
                name={habit.icon as any}
                size={22}
                color={isDone ? '#FFFFFF' : habit.color}
              />
            </View>

            {/* Habit Info */}
            <View style={styles.textWrap}>
              <View style={styles.nameRow}>
                <Text
                  style={[
                    styles.name,
                    {
                      color: isDone ? theme.textMuted : theme.text,
                      textDecorationLine: isDone ? 'line-through' : 'none',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {habit.name}
                </Text>
                {isSkipped && (
                  <View style={[styles.skipBadge, { backgroundColor: theme.surfaceHighlight }]}>
                    <Text style={[styles.skipText, { color: theme.textSubtle }]}>Skipped</Text>
                  </View>
                )}
              </View>

              {/* Progress / Target subtitle */}
              <View style={styles.metaRow}>
                {habit.type === 'count' && (
                  <Text style={[styles.metaText, { color: theme.textMuted }]}>
                    {currentValue} / {habit.target} done
                  </Text>
                )}
                {habit.type === 'minutes' && (
                  <Text style={[styles.metaText, { color: theme.textMuted }]}>
                    {currentValue} / {habit.target} mins
                  </Text>
                )}
                {habit.type === 'check' && (
                  <Text style={[styles.metaText, { color: theme.textMuted }]}>
                    {isDone ? 'Completed' : '1 tap to finish'}
                  </Text>
                )}

                {/* Streak flame indicator */}
                {streakStats.currentStreak > 0 && (
                  <View
                    style={[
                      styles.streakBadge,
                      {
                        backgroundColor: streakStats.isAtRisk ? 'rgba(245, 158, 11, 0.12)' : theme.surfaceHighlight,
                        borderColor: streakStats.isAtRisk ? theme.warning : 'transparent',
                      },
                    ]}
                  >
                    <Ionicons
                      name="flame"
                      size={13}
                      color={streakStats.isAtRisk ? theme.warning : '#F97316'}
                    />
                    <Text
                      style={[
                        styles.streakText,
                        {
                          color: streakStats.isAtRisk ? theme.warning : theme.textMuted,
                        },
                      ]}
                    >
                      {streakStats.currentStreak}
                      {streakStats.isAtRisk ? ' (at risk)' : ''}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Accessible Complete Button Fallback (Right Edge) */}
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                fireComplete();
              }}
              style={({ pressed }) => [
                styles.checkboxFallback,
                {
                  borderColor: isDone ? habit.color : theme.borderLight,
                  backgroundColor: isDone ? habit.color : pressed ? theme.surfaceHighlight : 'transparent',
                },
              ]}
              hitSlop={8}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isDone }}
              accessibilityLabel={`Mark ${habit.name} complete`}
            >
              {isDone ? (
                <Ionicons name="checkmark" size={17} color="#FFFFFF" />
              ) : habit.type === 'count' ? (
                <Text style={[styles.addOneText, { color: theme.textMuted }]}>+1</Text>
              ) : (
                <View style={styles.emptyCheckDot} />
              )}
            </Pressable>

            {/* Detail drilldown chevron */}
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                triggerHaptic.light();
                onOpenDetail();
              }}
              style={styles.moreButton}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="View habit details"
            >
              <Ionicons name="chevron-forward" size={16} color={theme.textSubtle} />
            </Pressable>
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    marginVertical: 4,
    position: 'relative',
    borderRadius: RADII.card,
    overflow: 'hidden',
  },
  completeBackground: {
    ...StyleSheet.absoluteFill,
    borderRadius: RADII.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: SPACING.lg,
  },
  completeIconWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  completeActionText: {
    ...TYPOGRAPHY.headline,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  actionsBackground: {
    ...StyleSheet.absoluteFill,
    borderRadius: RADII.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: SPACING.sm,
    gap: 6,
  },
  actionBtn: {
    width: 42,
    height: 48,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnLabel: {
    ...TYPOGRAPHY.tiny,
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
  },
  card: {
    borderRadius: RADII.card,
    borderWidth: 1,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.base,
    minHeight: 70,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.base,
  },
  textWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  name: {
    ...TYPOGRAPHY.headline,
    fontSize: 16,
    flexShrink: 1,
  },
  skipBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADII.sm,
  },
  skipText: {
    ...TYPOGRAPHY.tiny,
    fontSize: 10,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: 3,
  },
  metaText: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADII.sm,
    borderWidth: 1,
    gap: 3,
  },
  streakText: {
    ...TYPOGRAPHY.tiny,
    fontSize: 11,
    fontWeight: '600',
  },
  checkboxFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
  addOneText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    fontSize: 12,
  },
  emptyCheckDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  moreButton: {
    paddingHorizontal: 4,
    paddingVertical: 8,
    marginLeft: 2,
  },
});
