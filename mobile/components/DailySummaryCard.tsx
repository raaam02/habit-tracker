import React from 'react';
import { View, Text, StyleSheet, Pressable, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { useAppTheme } from '../constants/useAppTheme';
import { ProgressRing } from './ProgressRing';
import { TYPOGRAPHY, SPACING, RADII } from '../constants/theme';
import { triggerHaptic } from '../services/haptics';

export interface DailySummaryCardProps {
  completedCount: number;
  totalCount: number;
  date?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const DailySummaryCard: React.FC<DailySummaryCardProps> = ({
  completedCount,
  totalCount,
  date,
  onPress,
  style,
}) => {
  const { theme, isDark } = useAppTheme();

  if (totalCount === 0) return null;

  const isAllDone = completedCount >= totalCount;
  const remaining = Math.max(0, totalCount - completedCount);
  const percentage = Math.round((completedCount / totalCount) * 100);

  const getStatusBadge = () => {
    if (isAllDone) {
      return {
        icon: 'trophy' as const,
        text: 'All Done Today!',
        color: theme.success,
        bgColor: `${theme.success}18`,
        borderColor: `${theme.success}35`,
      };
    }
    if (completedCount > 0) {
      return {
        icon: 'flash' as const,
        text: `${percentage}% Completed`,
        color: theme.accent,
        bgColor: `${theme.accent}18`,
        borderColor: `${theme.accent}35`,
      };
    }
    return {
      icon: 'flag-outline' as const,
      text: "Today's Target",
      color: theme.textMuted,
      bgColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
      borderColor: theme.border,
    };
  };

  const getSubtitle = () => {
    if (isAllDone) {
      return 'Great momentum! Your streaks are locked in and protected.';
    }
    if (completedCount > 0) {
      return `${remaining} habit${remaining === 1 ? '' : 's'} remaining today. Keep going!`;
    }
    return `${totalCount} habit${totalCount === 1 ? '' : 's'} scheduled today. Take the first step!`;
  };

  const badge = getStatusBadge();

  const CardWrapper = onPress ? Pressable : View;

  return (
    <Animated.View
      layout={LinearTransition.springify().damping(22).stiffness(200)}
      style={[
        styles.cardContainer,
        {
          backgroundColor: theme.surface,
          borderColor: isAllDone ? `${theme.success}40` : theme.border,
        },
        style,
      ]}
    >
      <CardWrapper
        onPress={
          onPress
            ? () => {
                triggerHaptic.selection();
                onPress();
              }
            : undefined
        }
        style={styles.cardContent}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={`Daily Summary: ${completedCount} of ${totalCount} habits completed. ${getSubtitle()}`}
      >
        {/* Left Informational Column */}
        <View style={styles.infoCol}>
          {/* Top Status Pill */}
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: badge.bgColor,
                borderColor: badge.borderColor,
              },
            ]}
          >
            <Ionicons name={badge.icon} size={12} color={badge.color} style={styles.badgeIcon} />
            <Text style={[styles.statusPillText, { color: badge.color }]}>{badge.text}</Text>
          </View>

          {/* Main Title Heading */}
          <Text style={[styles.mainTitle, { color: theme.text }]} numberOfLines={1}>
            {isAllDone
              ? 'Rituals Complete! 🎉'
              : `${completedCount} of ${totalCount} habits done`}
          </Text>

          {/* Motivational Subtitle */}
          <Text style={[styles.subtitle, { color: theme.textMuted }]} numberOfLines={2}>
            {getSubtitle()}
          </Text>

          {/* Mini Metrics Row */}
          <View style={styles.metricsRow}>
            <View
              style={[
                styles.miniMetricChip,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.04)',
                },
              ]}
            >
              <Text style={[styles.miniMetricLabel, { color: theme.textSubtle }]}>
                Done <Text style={[styles.miniMetricValue, { color: theme.text }]}>{completedCount}</Text>
              </Text>
            </View>

            <View
              style={[
                styles.miniMetricChip,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.04)',
                },
              ]}
            >
              <Text style={[styles.miniMetricLabel, { color: theme.textSubtle }]}>
                Left <Text style={[styles.miniMetricValue, { color: theme.text }]}>{remaining}</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Right Circular Progress Ring */}
        <View style={styles.ringCol}>
          <ProgressRing
            completed={completedCount}
            total={totalCount}
            size={86}
            strokeWidth={8}
            strokeColor={isAllDone ? theme.success : theme.accent}
            trackColor={theme.surfaceHighlight}
            showRatio={true}
            label={isAllDone ? 'Done' : 'Done'}
            animationDuration={500}
          />
        </View>
      </CardWrapper>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: SPACING.base,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
    borderRadius: RADII.card,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.base,
    gap: SPACING.base,
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADII.pill,
    borderWidth: 1,
    marginBottom: 6,
  },
  badgeIcon: {
    marginRight: 4,
  },
  statusPillText: {
    ...TYPOGRAPHY.tiny,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  mainTitle: {
    ...TYPOGRAPHY.headline,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginBottom: 3,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniMetricChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADII.sm,
  },
  miniMetricLabel: {
    ...TYPOGRAPHY.tiny,
    fontSize: 11,
  },
  miniMetricValue: {
    fontWeight: '700',
  },
  ringCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
