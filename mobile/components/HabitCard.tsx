import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
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
  onOpenTimer?: () => void;
  onSkip: () => void;
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
  onOpenTimer,
  onSkip,
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

  // Fluid direct swipe gesture:
  // - Direct 1:1 right swipe across row to complete
  // - Direct 1:1 left swipe to reveal Skip & Archive (clamped cleanly at -110)
  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      'worklet';
      if (event.translationX > 0) {
        // Direct 1:1 tracking
        translateX.value = event.translationX;
      } else {
        // Clean direct left drawer opening, clamped at -110px without bouncy overstretch
        translateX.value = Math.max(-110, event.translationX);
      }
    })
    .onEnd((event) => {
      'worklet';
      const swipeDistance = event.translationX;
      const velocity = event.velocityX;

      if (swipeDistance > 110 || velocity > 450) {
        // Complete habit on full swipe
        runOnJS(fireComplete)();
        translateX.value = withTiming(0, { duration: 160 });
      } else if (swipeDistance < -55 || velocity < -350) {
        // Snap open left drawer cleanly
        translateX.value = withTiming(-110, { duration: 160 });
      } else {
        // Crisp smooth settle
        translateX.value = withTiming(0, { duration: 160 });
      }
    });

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { scale: pressScale.value }],
  }));

  // Full swipe-right fill
  const rightSwipeStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [0, 60], [0, 1], Extrapolation.CLAMP);
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
      if (onOpenTimer) {
        onOpenTimer();
      } else {
        onOpenNumberInput();
      }
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

      {/* Background layer for Swipe Left (Only Skip & Archive) */}
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
                    <Text style={[styles.skipBadgeText, { color: theme.textMuted }]}>Skipped</Text>
                  </View>
                )}
              </View>

              {/* Progress & Streak Indicators */}
              <View style={styles.metaRow}>
                {habit.type !== 'check' && (
                  <Text style={[styles.metaText, { color: theme.textMuted }]}>
                    {currentValue} / {habit.target} {habit.type === 'minutes' ? 'min' : ''}
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

            {/* Accessible Action Button Fallback (Right Edge) */}
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                if (habit.type === 'minutes' && !isDone && onOpenTimer) {
                  onOpenTimer();
                } else {
                  fireComplete();
                }
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
              ) : habit.type === 'minutes' ? (
                <Ionicons name="play" size={15} color={habit.color} />
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
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionsBackground: {
    ...StyleSheet.absoluteFill,
    borderRadius: RADII.card,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingRight: SPACING.xs,
    gap: SPACING.xs,
  },
  actionBtn: {
    width: 50,
    height: 48,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  actionBtnLabel: {
    ...TYPOGRAPHY.tiny,
    fontSize: 10,
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
    minHeight: 64,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  textWrap: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: 2,
  },
  name: {
    ...TYPOGRAPHY.headline,
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
  },
  skipBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  skipBadgeText: {
    ...TYPOGRAPHY.tiny,
    fontSize: 10,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  metaText: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADII.sm,
    borderWidth: 1,
  },
  streakText: {
    ...TYPOGRAPHY.tiny,
    fontSize: 11,
    fontWeight: '600',
  },
  checkboxFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  addOneText: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyCheckDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  moreButton: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
