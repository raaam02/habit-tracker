import React from 'react';
import { View, Text, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useAppTheme } from '../constants/useAppTheme';
import { SPACING, RADII, TYPOGRAPHY } from '../constants/theme';
import { triggerHaptic } from '../services/haptics';

export const WEEKDAYS = [
  { day: 0, label: 'Sun', short: 'S' },
  { day: 1, label: 'Mon', short: 'M' },
  { day: 2, label: 'Tue', short: 'T' },
  { day: 3, label: 'Wed', short: 'W' },
  { day: 4, label: 'Thu', short: 'T' },
  { day: 5, label: 'Fri', short: 'F' },
  { day: 6, label: 'Sat', short: 'S' },
];

export interface WeekdaySelectorProps {
  scheduledDays: number[];
  onToggleDay: (dayIndex: number) => void;
  activeColor?: string;
  style?: StyleProp<ViewStyle>;
}

export const WeekdaySelector: React.FC<WeekdaySelectorProps> = ({
  scheduledDays,
  onToggleDay,
  activeColor,
  style,
}) => {
  const { theme } = useAppTheme();
  const selectedColor = activeColor || theme.accent;

  return (
    <View style={[styles.container, style]}>
      {WEEKDAYS.map((d) => {
        const isScheduled = scheduledDays.includes(d.day);
        return (
          <Pressable
            key={d.day}
            onPress={() => {
              triggerHaptic.selection();
              onToggleDay(d.day);
            }}
            style={({ pressed }) => [
              styles.dayButton,
              {
                backgroundColor: isScheduled ? selectedColor : theme.elevated,
                borderColor: isScheduled ? selectedColor : theme.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: isScheduled }}
            accessibilityLabel={`${d.label}: ${isScheduled ? 'scheduled' : 'not scheduled'}`}
          >
            <Text
              style={[
                styles.dayText,
                {
                  color: isScheduled ? '#FFFFFF' : theme.textMuted,
                  fontWeight: isScheduled ? '700' : '500',
                },
              ]}
            >
              {d.short}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 6,
  },
  dayButton: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 44,
    borderRadius: RADII.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
  },
});
