import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  AppState,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Habit } from '../types/habit';
import { useAppTheme } from '../constants/useAppTheme';
import { useTimerStore } from '../store/timerStore';
import { SPACING, RADII, TYPOGRAPHY } from '../constants/theme';
import { triggerHaptic } from '../services/haptics';
import {
  showBackgroundTimerNotification,
  cancelBackgroundTimerNotification,
} from '../services/notifications';
import { ProgressRing } from './ProgressRing';

interface RunningHabitTimerProps {
  visible?: boolean;
  habit?: Habit | null;
  initialMinutes?: number;
  onClose?: () => void;
  onFinish?: (loggedMinutes: number, habitId?: string) => void;
}

export const RunningHabitTimer: React.FC<RunningHabitTimerProps> = ({
  visible: propVisible,
  habit: propHabit,
  initialMinutes = 0,
  onClose: propOnClose,
  onFinish: propOnFinish,
}) => {
  const { theme, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // Global timer store
  const storeHabit = useTimerStore((state) => state.habit);
  const storeHabitId = useTimerStore((state) => state.habitId);
  const isRunning = useTimerStore((state) => state.isRunning);
  const isFinished = useTimerStore((state) => state.isFinished);
  const isModalOpen = useTimerStore((state) => state.isModalOpen);
  const isFullscreen = useTimerStore((state) => state.isFullscreen);
  const targetMinutes = useTimerStore((state) => state.targetMinutes);

  const startTimer = useTimerStore((state) => state.startTimer);
  const pauseTimer = useTimerStore((state) => state.pauseTimer);
  const resumeTimer = useTimerStore((state) => state.resumeTimer);
  const resetTimer = useTimerStore((state) => state.resetTimer);
  const finishTimer = useTimerStore((state) => state.finishTimer);
  const markGoalReached = useTimerStore((state) => state.markGoalReached);
  const setModalOpen = useTimerStore((state) => state.setModalOpen);
  const toggleFullscreen = useTimerStore((state) => state.toggleFullscreen);
  const getElapsedSeconds = useTimerStore((state) => state.getElapsedSeconds);

  // Active habit resolution
  const activeHabit = storeHabit || propHabit;
  const isVisible = propVisible !== undefined ? propVisible || isModalOpen : isModalOpen;

  const [seconds, setSeconds] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);

  const lastTickRef = useRef<number>(Date.now());
  const controlsOpacity = useSharedValue(1);

  // Always reset controls to visible when modal opens or fullscreen mode changes
  useEffect(() => {
    setControlsVisible(true);
    controlsOpacity.value = 1;
  }, [isFullscreen, isVisible]);

  const toggleControls = () => {
    if (!isFullscreen) return;
    triggerHaptic.light();
    const next = !controlsVisible;
    setControlsVisible(next);
    controlsOpacity.value = withTiming(next ? 1 : 0, {
      duration: 250,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  };

  const controlsAnimStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
  }));

  const handleRingPress = () => {
    // If controls are hidden in fullscreen, tapping the ring also restores them
    if (isFullscreen && !controlsVisible) {
      toggleControls();
    }
  };

  const targetMins = activeHabit?.target || targetMinutes || 30;
  const targetSeconds = Math.max(60, targetMins * 60);

  // Clean, responsive ring dimensions
  const ringSize = isFullscreen
    ? Math.min(290, width - 80)
    : Math.min(240, width - 80);
  const strokeWidth = 12;

  // Initialize or start if opened via props
  useEffect(() => {
    if (propVisible && propHabit && (!storeHabitId || storeHabitId !== propHabit.id)) {
      startTimer(propHabit, initialMinutes);
    }
  }, [propVisible, propHabit, storeHabitId, initialMinutes, startTimer]);

  // Sync seconds from store on mount / resume
  useEffect(() => {
    if (isVisible && activeHabit) {
      const currentSecs = getElapsedSeconds();
      setSeconds(currentSecs);
      lastTickRef.current = Date.now();
    }
  }, [isVisible, activeHabit, getElapsedSeconds]);

  // Live timer ticks and AppState background integration
  useEffect(() => {
    if (!activeHabit) return;

    let ticker: any = null;

    if (isRunning) {
      lastTickRef.current = Date.now();

      ticker = setInterval(() => {
        const curSecs = getElapsedSeconds();
        setSeconds(curSecs);

        // When goal target is reached, automatically stop running and mark completed
        if (curSecs >= targetSeconds) {
          triggerHaptic.success();
          markGoalReached();
          cancelBackgroundTimerNotification(activeHabit.id);
        }
      }, 1000);
    }

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        if (isRunning && activeHabit) {
          const curSecs = getElapsedSeconds();
          showBackgroundTimerNotification(activeHabit.name, curSecs, targetMins, activeHabit.id);
        }
      } else if (nextState === 'active') {
        if (activeHabit) {
          cancelBackgroundTimerNotification(activeHabit.id);
          setSeconds(getElapsedSeconds());
        }
      }
    });

    return () => {
      if (ticker) clearInterval(ticker);
      subscription.remove();
    };
  }, [isRunning, activeHabit, targetSeconds, targetMins, getElapsedSeconds, markGoalReached]);

  if (!activeHabit || !isVisible) return null;

  const handleTogglePlayPause = () => {
    triggerHaptic.light();
    if (isRunning) {
      pauseTimer();
      cancelBackgroundTimerNotification(activeHabit.id);
    } else {
      resumeTimer();
    }
  };

  const handleReset = () => {
    triggerHaptic.medium();
    resetTimer();
    setSeconds(0);
    cancelBackgroundTimerNotification(activeHabit.id);
  };

  const handleFinish = () => {
    triggerHaptic.success();
    const habitId = activeHabit.id;
    cancelBackgroundTimerNotification(habitId);
    const { loggedMinutes } = finishTimer();

    if (propOnFinish) {
      propOnFinish(loggedMinutes, habitId);
    }
    if (propOnClose) {
      propOnClose();
    }
  };

  const handleMinimize = () => {
    triggerHaptic.light();
    setModalOpen(false);
    if (propOnClose) {
      propOnClose();
    }
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

  const topSafeArea = Math.max(insets.top, Platform.OS === 'ios' ? 44 : 24);
  const bottomSafeArea = Math.max(insets.bottom, 16);

  return (
    <Modal
      visible={isVisible}
      transparent={!isFullscreen}
      animationType={isFullscreen ? 'fade' : 'slide'}
      onRequestClose={handleMinimize}
    >
      <StatusBar
        hidden={isFullscreen && !controlsVisible}
        style={isDark ? 'light' : 'dark'}
      />
      <View
        style={[
          isFullscreen ? styles.fullscreenOverlay : styles.modalOverlay,
          { backgroundColor: isFullscreen ? theme.background : theme.overlay },
        ]}
      >
        <Pressable
          onPress={isFullscreen ? toggleControls : undefined}
          style={[
            isFullscreen ? styles.fullscreenContainer : styles.cardContainer,
            {
              backgroundColor: isFullscreen ? theme.background : theme.surface,
              borderColor: isFullscreen ? 'transparent' : theme.border,
              paddingTop: isFullscreen ? topSafeArea + SPACING.base : SPACING.lg,
              paddingBottom: isFullscreen ? bottomSafeArea + SPACING.base : SPACING.lg,
            },
          ]}
        >
          {/* Top Header Bar */}
          <Animated.View
            style={[styles.header, isFullscreen ? controlsAnimStyle : null]}
            pointerEvents={isFullscreen && !controlsVisible ? 'none' : 'box-none'}
          >
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.habitIconCircle,
                  { backgroundColor: `${activeHabit.color}20` },
                ]}
              >
                <Ionicons name={activeHabit.icon as any} size={20} color={activeHabit.color} />
              </View>
              <View style={styles.headerTitleWrap}>
                <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                  {activeHabit.name}
                </Text>
                <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                  {targetMins}m target
                </Text>
              </View>
            </View>

            {/* Right Action Icons: Fullscreen Toggle & Close Button */}
            <View style={styles.headerActions}>
              <Pressable
                onPress={() => {
                  triggerHaptic.selection();
                  toggleFullscreen();
                }}
                style={({ pressed }) => [
                  styles.headerBtn,
                  { backgroundColor: pressed ? theme.surfaceHighlight : theme.elevated },
                ]}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={isFullscreen ? 'Exit fullscreen mode' : 'Enter fullscreen mode'}
              >
                <Ionicons
                  name={isFullscreen ? 'contract-outline' : 'expand-outline'}
                  size={18}
                  color={theme.text}
                />
              </Pressable>

              <Pressable
                onPress={handleMinimize}
                style={({ pressed }) => [
                  styles.headerBtn,
                  { backgroundColor: pressed ? theme.surfaceHighlight : theme.elevated },
                ]}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close timer"
              >
                <Ionicons
                  name="close"
                  size={19}
                  color={theme.textMuted}
                />
              </Pressable>
            </View>
          </Animated.View>

          {/* Center Progress Ring Area */}
          <View
            style={isFullscreen ? styles.fullscreenCenterArea : styles.cardCenterArea}
            pointerEvents="box-none"
          >
            <Pressable
              onPress={handleRingPress}
              style={[
                styles.ringWrapper,
                { width: ringSize, height: ringSize, borderRadius: ringSize / 2 },
              ]}
            >
              <ProgressRing
                progress={targetSeconds > 0 ? Math.min(1, Math.max(0, seconds / targetSeconds)) : 0}
                size={ringSize}
                strokeWidth={strokeWidth}
                strokeColor={isFinished ? theme.success : activeHabit.color}
                trackColor={theme.surfaceHighlight}
                animationDuration={200}
              >
                <View style={styles.centerTimeWrap} pointerEvents="none">
                  <Text
                    style={[
                      isFullscreen ? styles.fullscreenTimerText : styles.cardTimerText,
                      {
                        color: theme.text,
                        fontVariant: ['tabular-nums'],
                      },
                    ]}
                  >
                    {formatTime()}
                  </Text>
                  {/* Show status label only if paused or finished - zero clutter while running */}
                  {isFinished ? (
                    <Animated.Text
                      style={[
                        styles.statusLabel,
                        { color: theme.success },
                        isFullscreen ? controlsAnimStyle : null,
                      ]}
                    >
                      Goal Reached! 🎉
                    </Animated.Text>
                  ) : !isRunning && seconds > 0 ? (
                    <Animated.Text
                      style={[
                        styles.statusLabel,
                        { color: theme.textMuted },
                        isFullscreen ? controlsAnimStyle : null,
                      ]}
                    >
                      Paused
                    </Animated.Text>
                  ) : null}
                </View>
              </ProgressRing>
            </Pressable>
          </View>

          {/* Controls Row */}
          <Animated.View
            style={[styles.controlsRow, isFullscreen ? controlsAnimStyle : null]}
            pointerEvents={isFullscreen && !controlsVisible ? 'none' : 'box-none'}
          >
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
                isFullscreen ? styles.fullscreenPrimaryBtn : styles.cardPrimaryBtn,
                {
                  backgroundColor: isFinished
                    ? theme.success
                    : activeHabit.color,
                  opacity: pressed ? 0.85 : 1,
                  transform: [{ scale: pressed ? 0.94 : 1 }],
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={isRunning ? 'Pause timer' : 'Start timer'}
            >
              <Ionicons
                name={isRunning ? 'pause' : 'play'}
                size={isFullscreen ? 34 : 28}
                color="#FFFFFF"
                style={{ marginLeft: isRunning ? 0 : 3 }}
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
          </Animated.View>
        </Pressable>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.base,
  },
  fullscreenOverlay: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  cardContainer: {
    width: '100%',
    maxWidth: 380,
    borderRadius: RADII.sheet,
    borderWidth: 1,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 20,
  },
  fullscreenContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitleWrap: {
    flex: 1,
  },
  habitIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.title2,
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCenterArea: {
    marginVertical: SPACING.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenCenterArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTimeWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTimerText: {
    fontSize: 40,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },
  fullscreenTimerText: {
    fontSize: 52,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
  statusLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
    marginTop: 6,
    fontWeight: '600',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xl,
    width: '100%',
    paddingBottom: SPACING.xs,
  },
  cardPrimaryBtn: {
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
  fullscreenPrimaryBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  secondaryCtrlBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
