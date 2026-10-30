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
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Habit } from '../types/habit';
import { useAppTheme } from '../constants/useAppTheme';
import { SPACING, RADII, TYPOGRAPHY, TOUCH_TARGET, SPRING_CONFIG } from '../constants/theme';
import { triggerHaptic } from '../services/haptics';

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
  const { theme } = useAppTheme();

  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const lastTickRef = useRef<number>(Date.now());
  const progressAnim = useSharedValue(0);

  const targetMinutes = habit?.target || 30;
  const targetSeconds = Math.max(60, targetMinutes * 60);

  useEffect(() => {
    if (visible && habit) {
      const startingSecs = Math.max(0, initialMinutes * 60);
      setSeconds(startingSecs);
      setIsActive(true);
      setIsFinished(startingSecs >= targetSeconds);
      progressAnim.value = targetSeconds > 0 ? startingSecs / targetSeconds : 0;
      lastTickRef.current = Date.now();
    } else {
      setIsActive(false);
      setSeconds(0);
    }
  }, [visible, habit, initialMinutes, targetSeconds]);

  // Background and live interval timer
  useEffect(() => {
    if (!visible || !isActive || isFinished) return;

    lastTickRef.current = Date.now();

    const updateTimer = () => {
      const now = Date.now();
      const deltaMs = now - lastTickRef.current;
      const deltaSecs = Math.floor(deltaMs / 1000);

      if (deltaSecs > 0) {
        setSeconds((prev) => {
          const next = prev + deltaSecs;
          const ratio = Math.min(1, next / targetSeconds);
          progressAnim.value = withTiming(ratio, {
            duration: 900,
            easing: Easing.linear,
          });

          if (next >= targetSeconds && !isFinished) {
            setIsFinished(true);
            triggerHaptic.success();
          }
          return next;
        });
        lastTickRef.current += deltaSecs * 1000;
      }
    };

    const interval = setInterval(updateTimer, 1000);

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        updateTimer();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [visible, isActive, isFinished, targetSeconds]);

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
    progressAnim.value = withTiming(0, { duration: 300 });
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

  const size = 260;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = Math.min(1, Math.max(0, seconds / targetSeconds));
  const strokeDashoffset = circumference - progressRatio * circumference;

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

          {/* Big Progress Ring with live timer */}
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
              {/* Active Progress */}
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={isFinished ? theme.success : habit.color}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
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
                  },
                ]}
              >
                {formatTime()}
              </Text>
              <Text style={[styles.statusLabel, { color: theme.textMuted }]}>
                {isFinished
                  ? 'Goal reached! 🎉'
                  : isActive
                  ? 'Focus session running'
                  : 'Paused'}
              </Text>
            </View>
          </View>

          {/* Controls Bar */}
          <View style={styles.controlsRow}>
            {/* Reset Button */}
            <Pressable
              onPress={handleReset}
              style={({ pressed }) => [
                styles.secondaryCtrlBtn,
                {
                  backgroundColor: pressed ? theme.surfaceHighlight : theme.elevated,
                  borderColor: theme.border,
                },
              ]}
              hitSlop={8}
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
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={isActive ? 'Pause timer' : 'Start timer'}
            >
              <Ionicons
                name={isActive ? 'pause' : 'play'}
                size={28}
                color="#FFFFFF"
              />
            </Pressable>

            {/* Finish & Log Progress Button */}
            <Pressable
              onPress={handleFinish}
              style={({ pressed }) => [
                styles.secondaryCtrlBtn,
                {
                  backgroundColor: pressed ? theme.surfaceHighlight : theme.elevated,
                  borderColor: isFinished ? theme.success : theme.border,
                },
              ]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Finish and log habit"
            >
              <Ionicons
                name="checkmark"
                size={22}
                color={isFinished ? theme.success : theme.accent}
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
    maxWidth: 420,
    borderRadius: RADII.sheet,
    padding: SPACING.xl,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
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
