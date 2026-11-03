import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../constants/useAppTheme';
import { useTimerStore } from '../store/timerStore';
import { TYPOGRAPHY, SPACING, RADII } from '../constants/theme';
import { triggerHaptic } from '../services/haptics';

interface CollapsibleHeaderProps {
  title: string;
  subtitle?: string;
  scrollY: SharedValue<number>;
  rightAction?: React.ReactNode;
}

export const CollapsibleHeader: React.FC<CollapsibleHeaderProps> = ({
  title,
  subtitle,
  scrollY,
  rightAction,
}) => {
  const { theme, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();

  // Connected running timer state
  const timerHabit = useTimerStore((state) => state.habit);
  const isTimerRunning = useTimerStore((state) => state.isRunning);
  const isModalOpen = useTimerStore((state) => state.isModalOpen);
  const setModalOpen = useTimerStore((state) => state.setModalOpen);
  const getElapsedSeconds = useTimerStore((state) => state.getElapsedSeconds);

  const [headerElapsed, setHeaderElapsed] = useState(0);

  useEffect(() => {
    if (!timerHabit || isModalOpen) return;

    setHeaderElapsed(getElapsedSeconds());

    if (!isTimerRunning) return;

    const interval = setInterval(() => {
      setHeaderElapsed(getElapsedSeconds());
    }, 1000);

    return () => clearInterval(interval);
  }, [timerHabit, isTimerRunning, isModalOpen, getElapsedSeconds]);

  // On iOS, ensure content clears the status bar / Dynamic Island (minimum 47pt fallback)
  const topInset = Platform.OS === 'ios' ? (insets.top > 0 ? insets.top : 47) : 0;

  // Hairline bottom border fades in when content scrolls underneath
  const borderAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 20],
      [0, 1],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const mins = Math.floor(headerElapsed / 60);
  const secs = headerElapsed % 60;
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <View
      style={[
        styles.headerContainer,
        {
          backgroundColor: theme.background,
          paddingTop: Platform.OS === 'ios' ? topInset + SPACING.xs : SPACING.xs,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleCol}>
          <Text style={[styles.largeTitleText, { color: theme.text }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitleText, { color: theme.textMuted }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={styles.rightGroup}>
          {/* Subtle minimal running habit timer chip in header - only when running */}
          {timerHabit && isTimerRunning && !isModalOpen && (
            <Pressable
              onPress={() => {
                triggerHaptic.selection();
                setModalOpen(true);
              }}
              style={({ pressed }) => [
                styles.timerChip,
                {
                  backgroundColor: pressed
                    ? theme.surfaceHighlight
                    : isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.05)',
                  borderColor: isTimerRunning ? `${timerHabit.color}60` : theme.border,
                },
              ]}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={`Running timer for ${timerHabit.name}: ${timeFormatted}. Tap to open.`}
            >
              <View style={[styles.timerChipIcon, { backgroundColor: `${timerHabit.color}25` }]}>
                <Ionicons name={timerHabit.icon as any} size={13} color={timerHabit.color} />
              </View>
              <Text style={[styles.timerChipText, { color: theme.text }]}>
                {timeFormatted}
              </Text>
              {isTimerRunning && (
                <View style={[styles.pulseDot, { backgroundColor: timerHabit.color }]} />
              )}
            </Pressable>
          )}

          {rightAction ? (
            <View style={styles.rightActionWrap}>{rightAction}</View>
          ) : null}
        </View>
      </View>
      <Animated.View
        style={[
          styles.headerBorder,
          { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' },
          borderAnimatedStyle,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.xs,
    position: 'relative',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleCol: {
    flex: 1,
  },
  largeTitleText: {
    ...TYPOGRAPHY.title1,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 0.35,
  },
  subtitleText: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: RADII.full,
    borderWidth: 1,
    gap: 6,
  },
  timerChipIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerChipText: {
    ...TYPOGRAPHY.tiny,
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  rightActionWrap: {
    marginLeft: 0,
  },
  headerBorder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
});


