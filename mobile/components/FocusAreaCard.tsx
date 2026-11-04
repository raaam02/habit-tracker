import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../constants/useAppTheme';
import { TYPOGRAPHY, SPACING, RADII } from '../constants/theme';
import { triggerHaptic } from '../services/haptics';

export interface FocusArea {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  templateIds: string[];
}

export interface FocusAreaCardProps {
  item: FocusArea;
  isSelected: boolean;
  onToggle: (item: FocusArea) => void;
}

export const FocusAreaCard: React.FC<FocusAreaCardProps> = ({
  item,
  isSelected,
  onToggle,
}) => {
  const { theme } = useAppTheme();

  return (
    <Pressable
      onPress={() => {
        triggerHaptic.selection();
        onToggle(item);
      }}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: isSelected ? theme.elevated : theme.surface,
          borderColor: isSelected ? item.color : theme.border,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={item.title}
    >
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: `${item.color}18` },
        ]}
      >
        <Ionicons name={item.icon as any} size={22} color={item.color} />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: theme.text }]}>
          {item.title}
        </Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          {item.subtitle}
        </Text>
      </View>
      <View
        style={[
          styles.check,
          {
            backgroundColor: isSelected ? item.color : 'transparent',
            borderColor: isSelected ? item.color : theme.borderLight,
          },
        ]}
      >
        {isSelected && <Ionicons name="checkmark" size={15} color="#FFFFFF" />}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
    borderRadius: RADII.card,
    borderWidth: 1.5,
    minHeight: 74,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  textWrap: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.headline,
    fontSize: 16,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
