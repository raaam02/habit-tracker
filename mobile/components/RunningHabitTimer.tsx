import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  AppState,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Habit } from '../types/habit';
import { useAppTheme } from '../constants/useAppTheme';
import { SPACING, RADII, TYPOGRAPHY, TOUCH_TARGET } from '../constants/theme';
import { triggerHaptic } from '../services/haptics';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface RunningHabitTimerProps {
  visible: boolean;
  habit: Habit | null;
  initialMinutes?: number;
  onClose: () => void;
  onFinish: (loggedMinutes: number) => void;
}

export const RunningHabitTimer: React.FC<RunningHabitTimerProps> = ({
  visible,
  habit,
  initialMinutes = 0,
  onClose,
  onFinish,
}) => {
  const { theme, isDark } = useAppTheme();

  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const lastTickRef = useRef<number>(Date.now());
  const animatedOffset = useSharedValue(0);

  const targetMinutes = habit?.target || 30;
  const targetSeconds = Math.max(60, targetMinutes * 60);

  const size = 260;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Initialize state when timer becomes visible
  useEffect(() => {
    if (visible && habit) {
      const startingSecs = Math.max(0, initialMinutes * 60);
      setSeconds(startingSecs);
      setIsActive(true);
      const finished = startingSecs >= targetSeconds;
      setIsFinished(finished);

      const ratio = targetSeconds > 0 ? Math.min(1, startingSecs / targetSeconds) : 0;
      animatedOffset.value = circumference - ratio * circumference;
      lastTickRef.current = Date.now();
    } else {
      setIsActive(false);
      setSeconds(0);
      animatedOffset.value = circumference;
    }
  }, [visible, habit, initialMinutes, targetSeconds, circumference]);

  // High-frequency 60fps clock for smooth fluid ring animation
  useEffect(() => {
    if (!visible || !isActive || isFinished) return;

    lastTickRef.current = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const deltaSecs = (now - lastTickRef.current) / 1000;
      const currentTotal = seconds + deltaSecs;

      const progress = Math.min(1, Math.max(0, currentTotal / targetSeconds));
      // Fluid direct offset update
      animatedOffset.value = circumference - progress * circumference;

      if (currentTotal >= targetSeconds && !isFinished) {
        setIsFinished(true);
        triggerHaptic.success();
      }
    }, 50); // 20 updates per second for butter-smooth SVG interpolation

    // 1-second display ticker
    const secondTimer = setInterval(() => {
      setSeconds((prev) => prev + 1);
      lastTickRef.current = Date.now();
    }, 1000);

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        const now = Date.now();
        const delta = Math.floor((now - lastTickRef.current) / 1000);
        if (delta > 0) {
          setSeconds((prev) => prev + delta);
        }
        lastTickRef.current = Date.now();
      }
    });

    return () => {
      clearInterval(interval);
      clearInterval(secondTimer);
      subscription.remove();
    };
  }, [visible, isActive, isFinished, targetSeconds, circumference, seconds]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: animatedOffset.value,
  }));

  if (!habit) return null;

  const handleTogglePlayPause = () => {
    triggerHaptic.light();
    setIsActive((prev) => !prev);
    lastTickRef.current = Date.now();
  };

  const handleReset = () => {
    triggerHaptic.medium();
    setSeconds(0);
    setIsFinished(false);
    setIsActive(false);
    animatedOffset.value = withTiming(circumference, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
  };

  const handleFinish = () => {
    triggerHaptic.success();
    const elapsedMinutes = Math.max(1, Math.round(seconds / 60));
    onFinish(elapsedMinutes);
    onClose();
  };

  // Format time MM:SS or HH:MM:SS
  const formatTime = () => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.habitIconCircle,
                  { backgroundColor: `${habit.color}20` },
                ]}
              >
                <Ionicons name={habit.icon as any} size={22} color={habit.color} />
              </View>
              <View>
                <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                  {habit.name}
                </Text>
                <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                  Target: {targetMinutes} minutes
                </Text>
              </View>
            </View>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeBtn,
                { backgroundColor: pressed ? theme.surfaceHighlight : 'transparent' },
              ]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close timer"
            >
              <Ionicons name="close" size={22} color={theme.textMuted} />
            </Pressable>
          </View>

          {/* Big Progress Ring with live continuous timer */}
          <View style={styles.ringWrapper}>
            <Svg width={size} height={size}>
              {/* Background Track */}
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={theme.surfaceHighlight}
                strokeWidth={strokeWidth}
                fill="none"
              />
              {/* Active Smooth Animated Progress */}
              <AnimatedCircle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={isFinished ? theme.success : habit.color}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                animatedProps={animatedProps}
                strokeLinecap="round"
                fill="none"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            </Svg>

            <View style={styles.centerTimeWrap}>
              <Text
                style={[
                  styles.timerText,
                  {
                    color: theme.text,
                    fontVariant: ['tabular-nums'],
                  },
                ]}
              >
                {formatTime()}
              </Text>
              <Text style={[styles.statusLabel, { color: isFinished ? theme.success : theme.textMuted }]}>
                {isFinished ? 'Goal Reached!' : isActive ? 'In Progress' : 'Paused'}
              </Text>
            </View>
          </View>

          {/* Controls */}
          <View style={styles.controlsRow}>
            {/* Reset */}
            <Pressable
              onPress={handleReset}
              style={({ pressed }) => [
                styles.secondaryCtrlBtn,
                {
                  backgroundColor: pressed ? theme.surfaceHighlight : theme.elevated,
                  borderColor: theme.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Reset timer"
            >
              <Ionicons name="refresh" size={20} color={theme.textMuted} />
            </Pressable>

            {/* Play / Pause Primary Button */}
            <Pressable
              onPress={handleTogglePlayPause}
              style={({ pressed }) => [
                styles.primaryCtrlBtn,
                {
                  backgroundColor: isFinished
                    ? theme.success
                    : habit.color,
                  opacity: pressed ? 0.85 : 1,
                  transform: [{ scale: pressed ? 0.94 : 1 }],
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={isActive ? 'Pause' : 'Start'}
            >
              <Ionicons
                name={isActive ? 'pause' : 'play'}
                size={28}
                color="#FFFFFF"
                style={{ marginLeft: isActive ? 0 : 3 }}
              />
            </Pressable>

            {/* Finish & Save */}
            <Pressable
              onPress={handleFinish}
              style={({ pressed }) => [
                styles.secondaryCtrlBtn,
                {
                  backgroundColor: pressed ? theme.surfaceHighlight : theme.elevated,
                  borderColor: isFinished ? theme.success : theme.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Finish and log habit"
            >
              <Ionicons
                name="checkmark"
                size={22}
                color={isFinished ? theme.success : theme.text}
              />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.base,
  },
  container: {
    width: '100%',
    maxWidth: 380,
    borderRadius: RADII.sheet,
    borderWidth: 1,
    padding: SPACING.lg,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  habitIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.title2,
    fontSize: 18,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.base,
  },
  centerTimeWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 42,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
  statusLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
    marginTop: 6,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xl,
    marginTop: SPACING.lg,
    width: '100%',
  },
  primaryCtrlBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  secondaryCtrlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
