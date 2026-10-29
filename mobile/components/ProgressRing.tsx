import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useAppTheme } from '../constants/useAppTheme';
import { TYPOGRAPHY } from '../constants/theme';

interface ProgressRingProps {
  completed: number;
  total: number;
  size?: number;
  strokeWidth?: number;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  completed,
  total,
  size = 84,
  strokeWidth = 7,
}) => {
  const { theme } = useAppTheme();

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? Math.min(1, Math.max(0, completed / total)) : 0;
  const strokeDashoffset = circumference - progress * circumference;

  const isAllDone = total > 0 && completed >= total;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background track circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.surfaceHighlight}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Active progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isAllDone ? theme.success : theme.accent}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.centerContent} pointerEvents="none">
        <Text style={[styles.ratioText, { color: theme.text }]}>
          {completed}
          <Text style={[styles.totalSubText, { color: theme.textMuted }]}>/{total}</Text>
        </Text>
        <Text style={[styles.labelText, { color: theme.textSubtle }]}>
          {isAllDone ? 'Done' : 'Done'}
        </Text>
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
  },
  totalSubText: {
    fontSize: 12,
    fontWeight: '500',
  },
  labelText: {
    ...TYPOGRAPHY.tiny,
    fontSize: 10,
    marginTop: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
