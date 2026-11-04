import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Habit } from '../types/habit';
import { useAppTheme } from '../constants/useAppTheme';
import { SPACING, RADII, TYPOGRAPHY } from '../constants/theme';

export interface ArchivedHabitCardProps {
  habit: Habit;
  onRestore: () => void;
  onDelete: () => void;
}

export const ArchivedHabitCard: React.FC<ArchivedHabitCardProps> = ({
  habit,
  onRestore,
  onDelete,
}) => {
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}
    >
      <View style={styles.infoRow}>
        <View style={[styles.iconWrap, { backgroundColor: `${habit.color}15` }]}>
          <Ionicons name={habit.icon as any} size={20} color={habit.color} />
        </View>
        <View style={styles.infoCol}>
          <Text style={[styles.name, { color: theme.textMuted }]} numberOfLines={1}>
            {habit.name}
          </Text>
          <Text style={[styles.subText, { color: theme.textSubtle }]}>
            Archived • Tap restore to bring back
          </Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          onPress={onRestore}
          style={({ pressed }) => [
            styles.actionBtn,
            { backgroundColor: pressed ? theme.surfaceHighlight : 'transparent' },
          ]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Restore habit"
        >
          <Ionicons name="refresh" size={18} color={theme.success} />
        </Pressable>

        <Pressable
          onPress={onDelete}
          style={({ pressed }) => [
            styles.actionBtn,
            { backgroundColor: pressed ? theme.surfaceHighlight : 'transparent' },
          ]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Delete habit permanently"
        >
          <Ionicons name="trash-outline" size={18} color={theme.danger} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.base,
    borderRadius: RADII.card,
    borderWidth: 1,
    marginBottom: SPACING.sm,
    opacity: 0.85,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  infoCol: {
    flex: 1,
  },
  name: {
    ...TYPOGRAPHY.headline,
    fontSize: 15,
    fontWeight: '600',
  },
  subText: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
