import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../constants/useAppTheme';
import { SPACING, RADII, TYPOGRAPHY, TOUCH_TARGET } from '../constants/theme';
import { triggerHaptic } from '../services/haptics';

export const CURATED_ICONS = [
  // Health & Fitness
  'barbell',
  'walk',
  'bicycle',
  'fitness',
  'water',
  'heart',
  'bed',
  'moon',
  // Productivity & Tech
  'code-slash',
  'git-commit',
  'book',
  'laptop',
  'pencil',
  'briefcase',
  'school',
  'time',
  // Mind & Lifestyle
  'sunny',
  'happy',
  'cafe',
  'leaf',
  'sparkles',
  'musical-notes',
  'camera',
  'calendar',
  // Finance & Home
  'cash',
  'wallet',
  'home',
  'cart',
  'nutrition',
  'restaurant',
];

interface IconPickerProps {
  selectedIcon: string;
  onSelectIcon: (iconName: string) => void;
  accentColor?: string;
}

export const IconPicker: React.FC<IconPickerProps> = ({
  selectedIcon,
  onSelectIcon,
  accentColor,
}) => {
  const { theme } = useAppTheme();
  const activeColor = accentColor || theme.accent;

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
        Choose Icon
      </Text>
      <View style={styles.grid}>
        {CURATED_ICONS.map((iconName) => {
          const isSelected = selectedIcon === iconName;
          return (
            <Pressable
              key={iconName}
              onPress={() => {
                triggerHaptic.selection();
                onSelectIcon(iconName);
              }}
              style={({ pressed }) => [
                styles.iconButton,
                {
                  backgroundColor: isSelected
                    ? `${activeColor}20`
                    : pressed
                    ? theme.surfaceHighlight
                    : theme.surface,
                  borderColor: isSelected ? activeColor : theme.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Select ${iconName} icon`}
              accessibilityState={{ selected: isSelected }}
            >
              <Ionicons
                name={iconName as any}
                size={22}
                color={isSelected ? activeColor : theme.text}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.sm,
  },
  sectionTitle: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: SPACING.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: RADII.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
