import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../constants/useAppTheme';
import { TYPOGRAPHY, SPACING, RADII } from '../constants/theme';

export interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  value: string | number;
  label: string;
  badge?: string;
  badgeColor?: string;
  variant?: 'surface' | 'elevated';
  style?: StyleProp<ViewStyle>;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  iconColor,
  value,
  label,
  badge,
  badgeColor,
  variant = 'surface',
  style,
}) => {
  const { theme } = useAppTheme();
  const bg = variant === 'elevated' ? theme.elevated : theme.surface;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: bg,
          borderColor: theme.border,
        },
        style,
      ]}
    >
      <View style={styles.iconRow}>
        <Ionicons name={icon} size={21} color={iconColor} />
        {badge ? (
          <View
            style={[
              styles.badgeWrap,
              { backgroundColor: badgeColor ? `${badgeColor}18` : 'transparent' },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: badgeColor || theme.warning },
              ]}
            >
              {badge}
            </Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textMuted }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
    padding: SPACING.md,
    borderRadius: RADII.card,
    borderWidth: 1,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
    minHeight: 22,
  },
  badgeWrap: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADII.pill,
  },
  badgeText: {
    ...TYPOGRAPHY.tiny,
    fontSize: 10,
    fontWeight: '700',
  },
  statValue: {
    ...TYPOGRAPHY.title1,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    fontWeight: '500',
  },
});
