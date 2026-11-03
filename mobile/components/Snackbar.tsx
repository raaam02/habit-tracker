import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../constants/useAppTheme';
import { useHabitStore } from '../store/habitStore';
import { SPACING, RADII, TYPOGRAPHY } from '../constants/theme';
import { triggerHaptic } from '../services/haptics';

export const Snackbar: React.FC = () => {
  const { theme, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const undoRecord = useHabitStore((state) => state.undoRecord);
  const undoLastAction = useHabitStore((state) => state.undoLastAction);
  const clearUndo = useHabitStore((state) => state.clearUndo);
  const habits = useHabitStore((state) => state.habits);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(40);
  const opacity = useSharedValue(0);

  const habit = habits.find((h) => h.id === undoRecord?.habitId);

  // Position safely above the floating glass tab bar
  const bottomOffset = Platform.OS === 'ios'
    ? Math.max(insets.bottom, 16) + 68
    : Math.max(insets.bottom, 16) + 68;

  const handleDismiss = () => {
    triggerHaptic.light();
    clearUndo();
  };

  useEffect(() => {
    if (undoRecord) {
      translateX.value = 0;
      translateY.value = 40;
      opacity.value = 0;

      // Animate in smoothly
      translateY.value = withSpring(0, { damping: 18, stiffness: 220 });
      opacity.value = withTiming(1, { duration: 200 });

      // Dismiss automatically after 5000ms
      const timer = setTimeout(() => {
        translateY.value = withTiming(30, { duration: 150 });
        opacity.value = withTiming(0, { duration: 150 }, (finished) => {
          if (finished) {
            runOnJS(clearUndo)();
          }
        });
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      opacity.value = 0;
      translateY.value = 40;
      translateX.value = 0;
    }
  }, [undoRecord, translateX, translateY, opacity, clearUndo]);

  const handleUndo = () => {
    triggerHaptic.medium();
    undoLastAction();
    translateY.value = withTiming(30, { duration: 150 });
    opacity.value = withTiming(0, { duration: 150 }, (finished) => {
      if (finished) {
        runOnJS(clearUndo)();
      }
    });
  };

  // Pan gesture for smooth swipe-to-dismiss (downward or sideways)
  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .activeOffsetY([0, 10])
    .onUpdate((e) => {
      'worklet';
      translateX.value = e.translationX;
      translateY.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      'worklet';
      const isSwipedDown = e.translationY > 25 || e.velocityY > 300;
      const isSwipedHorizontal = Math.abs(e.translationX) > 60 || Math.abs(e.velocityX) > 400;

      if (isSwipedDown) {
        translateY.value = withTiming(80, { duration: 140 });
        opacity.value = withTiming(0, { duration: 140 }, (finished) => {
          if (finished) {
            runOnJS(handleDismiss)();
          }
        });
      } else if (isSwipedHorizontal) {
        const targetX = e.translationX > 0 ? 350 : -350;
        translateX.value = withTiming(targetX, { duration: 140 });
        opacity.value = withTiming(0, { duration: 140 }, (finished) => {
          if (finished) {
            runOnJS(handleDismiss)();
          }
        });
      } else {
        // Return to original resting position
        translateX.value = withSpring(0, { damping: 22, stiffness: 280 });
        translateY.value = withSpring(0, { damping: 22, stiffness: 280 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-150, 150],
      [-5, 5],
      Extrapolation.CLAMP
    );
    const dragDistance = Math.abs(translateX.value) + translateY.value;
    const dragFactor = Math.min(1, dragDistance / 100);
    const dynOpacity = opacity.value * (1 - dragFactor * 0.4);

    return {
      opacity: dynOpacity,
      transform: [
        { translateY: translateY.value },
        { translateX: translateX.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  if (!undoRecord) return null;

  return (
    <View pointerEvents="box-none" style={[styles.rootWrapper, { bottom: bottomOffset }]}>
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: isDark ? 'rgba(30, 34, 42, 0.96)' : 'rgba(255, 255, 255, 0.96)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.1)',
            },
            animatedStyle,
          ]}
        >
          {/* Subtle Swipe Handle Cue */}
          <View style={styles.topCueWrap}>
            <View
              style={[
                styles.swipeCue,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)' },
              ]}
            />
          </View>

          <View style={styles.innerRow}>
            <View style={styles.content}>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={theme.success}
                style={styles.icon}
              />
              <Text style={[styles.text, { color: theme.text }]} numberOfLines={1}>
                Updated <Text style={styles.habitName}>{habit?.name || 'Habit'}</Text>
              </Text>
            </View>

            <Pressable
              onPress={handleUndo}
              style={({ pressed }) => [
                styles.undoButton,
                {
                  backgroundColor: pressed
                    ? theme.surfaceHighlight
                    : isDark
                    ? 'rgba(99, 102, 241, 0.2)'
                    : 'rgba(99, 102, 241, 0.12)',
                },
              ]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Undo habit completion"
            >
              <Text style={[styles.undoText, { color: theme.accent }]}>Undo</Text>
            </Pressable>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  rootWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  container: {
    width: '92%',
    maxWidth: 420,
    borderRadius: RADII.card,
    borderWidth: 1,
    paddingHorizontal: SPACING.base,
    paddingTop: 6,
    paddingBottom: SPACING.sm + 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 10,
  },
  topCueWrap: {
    alignItems: 'center',
    marginBottom: 5,
  },
  swipeCue: {
    width: 28,
    height: 3,
    borderRadius: 2,
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  icon: {
    marginRight: SPACING.sm,
  },
  text: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    flexShrink: 1,
  },
  habitName: {
    fontWeight: '700',
  },
  undoButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADII.sm,
  },
  undoText: {
    ...TYPOGRAPHY.headline,
    fontSize: 14,
    fontWeight: '700',
  },
});
