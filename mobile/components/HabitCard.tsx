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
} from 'react-native-reanimated';
import { Habit, HabitLog, StreakStats } from '../types/habit';
import { useAppTheme } from '../constants/useAppTheme';
import { useHabitStore } from '../store/habitStore';
import { triggerHaptic } from '../services/haptics';
import { SPACING, RADII, TYPOGRAPHY, TOUCH_TARGET } from '../constants/theme';
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
  const rowScale = useSharedValue(1);

  // First-run swipe hint animation
  useEffect(() => {
    if (isFirstRow && !settings.hasSeenSwipeHint) {
      const timer = setTimeout(() => {
        translateX.value = withSequence(
          withTiming(45, { duration: 350 }),
          withTiming(0, { duration: 300 }, (finished) => {
            if (finished) {
              runOnJS(updateSettings)({ hasSeenSwipeHint: true });
            }
          })
        );
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isFirstRow, settings.hasSeenSwipeHint]);

  const fireComplete = () => {
    triggerHaptic.success();
    onComplete();
  };

  const fireHapticTick = () => {
    triggerHaptic.light();
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-15, 15])
    .onUpdate((event) => {
      'worklet';
      // Resistance dampening beyond thresholds
      if (event.translationX > 0) {
        translateX.value = Math.min(event.translationX, 140);
      } else {
        translateX.value = Math.max(event.translationX, -160);
      }
    })
    .onEnd((event) => {
      'worklet';
      const swipeDistance = event.translationX;

      if (swipeDistance > 75) {
        // Swipe right threshold passed -> complete habit!
        runOnJS(fireComplete)();
        translateX.value = settings.reduceMotion
          ? withTiming(0, { duration: 150 })
          : withSpring(0, { damping: 15 });
      } else if (swipeDistance < -85) {
        // Keep actions revealed
        translateX.value = settings.reduceMotion
          ? withTiming(-140, { duration: 150 })
          : withSpring(-140, { damping: 16 });
      } else {
        // Spring back to 0
        translateX.value = settings.reduceMotion
          ? withTiming(0, { duration: 150 })
          : withSpring(0, { damping: 15 });
      }
    });

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { scale: rowScale.value }],
  }));

  // Swipe right background fill (reveals habit color)
  const rightSwipeStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [0, 60], [0, 1], Extrapolation.CLAMP);
    return {
      opacity,
      backgroundColor: habit.color,
    };
  });

  // Swipe left actions container
  const leftSwipeStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [-20, -70], [0, 1], Extrapolation.CLAMP);
    return {
      opacity,
    };
  });

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
    translateX.value = withSpring(0, { damping: 16 });
  };

  return (
    <View style={styles.outerContainer}>
      {/* Background layer for Swipe Right (Complete) */}
      <Animated.View style={[styles.completeBackground, rightSwipeStyle]}>
        <View style={styles.completeIconWrap}>
          <Ionicons name="checkmark-circle" size={28} color="#FFFFFF" />
          <Text style={styles.completeActionText}>Complete</Text>
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
          style={[styles.actionBtn, { backgroundColor: theme.surfaceHighlight }]}
          accessibilityRole="button"
          accessibilityLabel="Skip habit today"
        >
          <Ionicons name="play-forward" size={18} color={theme.textMuted} />
          <Text style={[styles.actionBtnLabel, { color: theme.textMuted }]}>Skip</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            handleResetSwipe();
            triggerHaptic.light();
            onEdit();
          }}
          style={[styles.actionBtn, { backgroundColor: theme.surfaceHighlight }]}
          accessibilityRole="button"
          accessibilityLabel="Edit habit"
        >
          <Ionicons name="pencil" size={18} color={theme.accent} />
          <Text style={[styles.actionBtnLabel, { color: theme.accent }]}>Edit</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            handleResetSwipe();
            triggerHaptic.medium();
            onArchive();
          }}
          style={[styles.actionBtn, { backgroundColor: theme.surfaceHighlight }]}
          accessibilityRole="button"
          accessibilityLabel="Archive habit"
        >
          <Ionicons name="archive" size={18} color={theme.danger} />
          <Text style={[styles.actionBtnLabel, { color: theme.danger }]}>Archive</Text>
        </Pressable>
      </Animated.View>

      {/* Foreground Interactive Card */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: isDone ? theme.surfaceHighlight : theme.surface,
              borderColor: isDone ? habit.color : theme.border,
            },
            cardAnimatedStyle,
          ]}
        >
          <Pressable
            onPress={handleCardPress}
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
                  backgroundColor: isDone ? habit.color : `${habit.color}25`,
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
                        backgroundColor: streakStats.isAtRisk ? '#F59E0B20' : theme.surfaceHighlight,
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
                      {streakStats.isAtRisk ? ' (At Risk)' : ''}
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
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              ) : habit.type === 'count' ? (
                <Text style={[styles.addOneText, { color: theme.textMuted }]}>+1</Text>
              ) : (
                <View style={[styles.emptyCheckDot, { backgroundColor: 'transparent' }]} />
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
    </View>
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
    gap: SPACING.xs,
  },
  actionBtn: {
    width: 44,
    height: 48,
    borderRadius: RADII.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnLabel: {
    ...TYPOGRAPHY.tiny,
    fontSize: 9,
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
    minHeight: 68,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    paddingHorizontal: 6,
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
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
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
    borderWidth: 2,
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
  },
  moreButton: {
    paddingHorizontal: 4,
    paddingVertical: 8,
    marginLeft: 2,
  },
});
