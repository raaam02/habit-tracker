import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../constants/useAppTheme';
import { TYPOGRAPHY, SPACING, RADII } from '../constants/theme';
import { triggerHaptic } from '../services/haptics';
import { HabitTemplate } from '../constants/templates';

export interface TemplateSelectCardProps {
  template: HabitTemplate;
  isSelected: boolean;
  onToggle: (templateId: string) => void;
}

export const TemplateSelectCard: React.FC<TemplateSelectCardProps> = ({
  template,
  isSelected,
  onToggle,
}) => {
  const { theme } = useAppTheme();

  return (
    <Pressable
      onPress={() => {
        triggerHaptic.selection();
        onToggle(template.templateId);
      }}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: isSelected ? theme.elevated : theme.surface,
          borderColor: isSelected ? template.color : theme.border,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isSelected }}
      accessibilityLabel={template.name}
    >
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: `${template.color}18` },
        ]}
      >
        <Ionicons name={template.icon as any} size={20} color={template.color} />
      </View>

      <View style={styles.textWrap}>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {template.name}
        </Text>
        <Text style={[styles.meta, { color: theme.textMuted }]}>
          {template.type === 'check'
            ? 'Daily check'
            : template.type === 'count'
            ? `${template.target} times`
            : `${template.target} mins`}
        </Text>
      </View>

      <View
        style={[
          styles.check,
          {
            backgroundColor: isSelected ? template.color : 'transparent',
            borderColor: isSelected ? template.color : theme.borderLight,
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
    padding: SPACING.md,
    borderRadius: RADII.card,
    borderWidth: 1.5,
    minHeight: 64,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  textWrap: {
    flex: 1,
  },
  name: {
    ...TYPOGRAPHY.headline,
    fontSize: 15,
  },
  meta: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    marginTop: 2,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
});
