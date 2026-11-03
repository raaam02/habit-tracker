import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useAppTheme } from '../constants/useAppTheme';
import { TYPOGRAPHY } from '../constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface ProgressRingProps {
  /** Number of completed items/minutes */
  completed?: number;
  /** Total target items/minutes */
  total?: number;
  /** Direct progress value between 0 and 1 (overrides completed / total if provided) */
  progress?: number;
  /** Diameter of the ring in points (default: 84) */
  size?: number;
  /** Stroke thickness of active progress arc (default: 7) */
  strokeWidth?: number;
  /** Stroke linecap ('round' | 'butt' | 'square', default: 'round') */
  strokeLinecap?: 'round' | 'butt' | 'square';
  /** Color of the active arc. Defaults to theme.success if complete, else theme.accent */
  strokeColor?: string;
  /** Color of the background circle track */
  trackColor?: string;
  /** Track stroke thickness (defaults to strokeWidth) */
  trackStrokeWidth?: number;
  /** Whether to show the completed/total ratio text inside the ring (default: true if no children) */
  showRatio?: boolean;
  /** Whether to show percentage text (e.g. 75%) inside the ring */
  showPercentage?: boolean;
  /** Subtitle label text under the ratio/percentage (default: 'Done') */
  label?: string;
  /** Custom children to render inside the center of the ring */
  children?: React.ReactNode;
  /** Animation duration in ms (default: 450) */
  animationDuration?: number;
  /** Container style */
  style?: StyleProp<ViewStyle>;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  completed = 0,
  total = 0,
  progress,
  size = 84,
  strokeWidth = 7,
  strokeLinecap = 'round',
  strokeColor,
  trackColor,
  trackStrokeWidth,
  showRatio = true,
  showPercentage = false,
  label = 'Done',
  children,
  animationDuration = 450,
  style,
}) => {
  const { theme } = useAppTheme();

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const targetProgress =
    progress !== undefined
      ? Math.min(1, Math.max(0, progress))
      : total > 0
      ? Math.min(1, Math.max(0, completed / total))
      : 0;

  const isAllDone = targetProgress >= 1 && (total > 0 || progress !== undefined);

  // Smooth Reanimated growth
  const animatedProgress = useSharedValue(targetProgress);

  useEffect(() => {
    animatedProgress.value = withTiming(targetProgress, {
      duration: animationDuration,
      easing: Easing.out(Easing.cubic),
    });
  }, [targetProgress, animationDuration, animatedProgress]);

  const animatedCircleProps = useAnimatedProps(() => {
    const offset = circumference - animatedProgress.value * circumference;
    return {
      strokeDashoffset: offset,
    };
  });

  const activeColor = strokeColor || (isAllDone ? theme.success : theme.accent);
  const inactiveTrackColor = trackColor || theme.surfaceHighlight;
  const bgStrokeWidth = trackStrokeWidth || strokeWidth;

  const percentageInt = Math.round(targetProgress * 100);

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        {/* Background track circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={inactiveTrackColor}
          strokeWidth={bgStrokeWidth}
          fill="none"
        />
        {/* Smoothly animated active progress arc */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={activeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          animatedProps={animatedCircleProps}
          strokeLinecap={strokeLinecap}
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      <View style={styles.centerContent} pointerEvents="none">
        {children ? (
          children
        ) : showPercentage ? (
          <>
            <Text style={[styles.percentageText, { color: theme.text }]}>
              {percentageInt}%
            </Text>
            {label ? (
              <Text style={[styles.labelText, { color: theme.textSubtle }]}>
                {label}
              </Text>
            ) : null}
          </>
        ) : showRatio ? (
          <>
            <Text style={[styles.ratioText, { color: theme.text }]}>
              {completed}
              <Text style={[styles.totalSubText, { color: theme.textMuted }]}>/{total}</Text>
            </Text>
            {label ? (
              <Text style={[styles.labelText, { color: theme.textSubtle }]}>
                {label}
              </Text>
            ) : null}
          </>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  centerContent: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratioText: {
    ...TYPOGRAPHY.headline,
    fontSize: 16,
    lineHeight: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  percentageText: {
    ...TYPOGRAPHY.headline,
    fontSize: 16,
    lineHeight: 18,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  totalSubText: {
    fontSize: 12,
    fontWeight: '500',
  },
  labelText: {
    ...TYPOGRAPHY.tiny,
    fontSize: 10,
    marginTop: 1,
    letterSpacing: 0.3,
  },
});
