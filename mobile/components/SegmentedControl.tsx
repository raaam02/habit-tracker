import React from 'react';
import { View, Text, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useAppTheme } from '../constants/useAppTheme';
import { TYPOGRAPHY, SPACING, RADII } from '../constants/theme';
import { triggerHaptic } from '../services/haptics';

export interface SegmentOption<T extends string | number> {
  value: T;
  label: string;
  badge?: number | string;
}

export interface SegmentedControlProps<T extends string | number> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  size = 'md',
  style,
}: SegmentedControlProps<T>) {
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.elevated },
        size === 'sm' && styles.containerSm,
        style,
      ]}
    >
      {options.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <Pressable
            key={String(opt.value)}
            onPress={() => {
              if (!isSelected) {
                triggerHaptic.selection();
                onChange(opt.value);
              }
            }}
            style={[
              styles.button,
              size === 'sm' ? styles.buttonSm : styles.buttonMd,
              {
                backgroundColor: isSelected ? theme.accent : 'transparent',
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={opt.label}
          >
            <Text
              style={[
                styles.label,
                size === 'sm' && styles.labelSm,
                {
                  color: isSelected ? '#FFFFFF' : theme.textMuted,
                  fontWeight: isSelected ? '700' : '500',
                },
              ]}
              numberOfLines={1}
            >
              {opt.label}
              {opt.badge !== undefined ? ` (${opt.badge})` : ''}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: RADII.md,
    padding: 3,
  },
  containerSm: {
    borderRadius: RADII.sm,
    padding: 2,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.sm,
  },
  buttonMd: {
    paddingVertical: 9,
    paddingHorizontal: 8,
  },
  buttonSm: {
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  label: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
  },
  labelSm: {
    fontSize: 12,
  },
});
