import React from 'react';
import { View, Text, StyleSheet, Pressable, StyleProp, ViewStyle } from 'react-native';
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
  const { theme } = useAppTheme();

  if (totalCount === 0) return null;

  const isAllDone = completedCount >= totalCount;
  const remaining = Math.max(0, totalCount - completedCount);

  const title = isAllDone
    ? 'All habits completed 🎉'
    : `${completedCount} of ${totalCount} habits done`;

  const subtitle = isAllDone
    ? 'Great momentum. Streaks are protected.'
    : `${remaining} remaining today`;

  const CardWrapper = onPress ? Pressable : View;

  return (
    <Animated.View
      layout={LinearTransition.duration(200)}
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
        accessibilityLabel={`Daily Summary: ${title}. ${subtitle}.`}
      >
        <View style={styles.textWrap}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>

        <ProgressRing
          completed={completedCount}
          total={totalCount}
          size={74}
          strokeWidth={7}
          strokeColor={isAllDone ? theme.success : theme.accent}
          trackColor={theme.surfaceHighlight}
          showRatio={true}
          label="Done"
          animationDuration={450}
        />
      </CardWrapper>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    borderRadius: RADII.card,
    borderWidth: 1,
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.base,
  },
  textWrap: {
    flex: 1,
    marginRight: SPACING.base,
  },
  title: {
    ...TYPOGRAPHY.headline,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
  },
});
