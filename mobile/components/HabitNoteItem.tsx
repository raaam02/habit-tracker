import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Habit, HabitLog } from '../types/habit';
import { useAppTheme } from '../constants/useAppTheme';
import { formatHeaderDate } from '../utils/date';
import { TYPOGRAPHY, SPACING, RADII } from '../constants/theme';

export interface HabitNoteItemProps {
  log: HabitLog;
  habit: Habit;
}

export const HabitNoteItem: React.FC<HabitNoteItemProps> = ({ log, habit }) => {
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        styles.noteItem,
        {
          backgroundColor: theme.elevated,
          borderColor: theme.border,
        },
      ]}
    >
      <View style={styles.noteMetaRow}>
        <Text style={[styles.noteDate, { color: theme.textMuted }]}>
          {formatHeaderDate(log.date)}
        </Text>
        <Text style={[styles.noteValue, { color: theme.accent }]}>
          {log.value} {habit.type === 'minutes' ? 'min' : ''}
        </Text>
      </View>
      <Text style={[styles.noteText, { color: theme.text }]}>{log.note}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  noteItem: {
    padding: SPACING.md,
    borderRadius: RADII.md,
    borderWidth: 1,
    gap: SPACING.xs,
  },
  noteMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteDate: {
    ...TYPOGRAPHY.tiny,
    fontSize: 11,
    fontWeight: '600',
  },
  noteValue: {
    ...TYPOGRAPHY.tiny,
    fontSize: 11,
    fontWeight: '700',
  },
  noteText: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
    lineHeight: 18,
  },
});
