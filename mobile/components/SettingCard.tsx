import React from 'react';
import { View, Text, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useAppTheme } from '../constants/useAppTheme';
import { TYPOGRAPHY, SPACING, RADII } from '../constants/theme';
import { triggerHaptic } from '../services/haptics';

export interface SettingCardProps {
  title?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const SettingCard: React.FC<SettingCardProps> = ({ title, children, style }) => {
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
        style,
      ]}
    >
      {title ? (
        <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
      ) : null}
      {children}
    </View>
  );
};

export interface SettingRowProps {
  title: string;
  subtitle?: string;
  rightControl?: React.ReactNode;
  onPress?: () => void;
  borderTop?: boolean;
  destructive?: boolean;
}

export const SettingRow: React.FC<SettingRowProps> = ({
  title,
  subtitle,
  rightControl,
  onPress,
  borderTop = false,
  destructive = false,
}) => {
  const { theme } = useAppTheme();
  const RowWrapper = onPress ? Pressable : View;

  return (
    <RowWrapper
      onPress={
        onPress
          ? () => {
              triggerHaptic.selection();
              onPress();
            }
          : undefined
      }
      style={[
        styles.row,
        borderTop && {
          borderTopWidth: 1,
          borderTopColor: theme.border,
          marginTop: SPACING.base,
          paddingTop: SPACING.md,
        },
      ]}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <View style={styles.labelCol}>
        <Text
          style={[
            styles.title,
            { color: destructive ? theme.danger : theme.text },
          ]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>{subtitle}</Text>
        ) : null}
      </View>
      {rightControl ? <View style={styles.controlWrap}>{rightControl}</View> : null}
    </RowWrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADII.card,
    borderWidth: 1,
    padding: SPACING.base,
    marginBottom: SPACING.base,
  },
  cardTitle: {
    ...TYPOGRAPHY.headline,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.md,
  },
  labelCol: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.body,
    fontSize: 15,
    fontWeight: '600',
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  controlWrap: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
