import React from 'react';
import { View, Text, Modal, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useAppTheme } from '../constants/useAppTheme';
import { CURATED_ICONS } from './IconPicker';
import { SPACING, RADII, TYPOGRAPHY } from '../constants/theme';
import { triggerHaptic } from '../services/haptics';

export interface IconPickerModalProps {
  visible: boolean;
  selectedIcon: string;
  activeColor?: string;
  onSelectIcon: (iconName: string) => void;
  onClose: () => void;
}

export const IconPickerModal: React.FC<IconPickerModalProps> = ({
  visible,
  selectedIcon,
  activeColor,
  onSelectIcon,
  onClose,
}) => {
  const { theme, isDark } = useAppTheme();
  const tintColor = activeColor || theme.accent;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.sheetContainer,
            {
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            },
          ]}
        >
          {Platform.OS === 'ios' ? (
            <BlurView
              intensity={90}
              tint={isDark ? 'systemMaterialDark' : 'systemMaterialLight'}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.surface }]} />
          )}

          <View style={styles.handleContainer}>
            <View style={[styles.handleBar, { backgroundColor: theme.borderLight }]} />
          </View>

          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Choose icon</Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close icon picker"
            >
              <Ionicons name="close" size={22} color={theme.textMuted} />
            </Pressable>
          </View>

          <ScrollView style={styles.iconScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.iconGrid}>
              {CURATED_ICONS.map((iconName) => {
                const isSelected = selectedIcon === iconName;
                return (
                  <Pressable
                    key={iconName}
                    onPress={() => {
                      triggerHaptic.selection();
                      onSelectIcon(iconName);
                      onClose();
                    }}
                    style={({ pressed }) => [
                      styles.iconGridItem,
                      {
                        backgroundColor: isSelected
                          ? `${tintColor}25`
                          : pressed
                          ? theme.surfaceHighlight
                          : theme.elevated,
                        borderColor: isSelected ? tintColor : 'transparent',
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={iconName}
                  >
                    <Ionicons
                      name={iconName as any}
                      size={24}
                      color={isSelected ? tintColor : theme.text}
                    />
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheetContainer: {
    width: '100%',
    maxHeight: '75%',
    maxWidth: 520,
    alignSelf: 'center',
    borderTopLeftRadius: RADII.sheet,
    borderTopRightRadius: RADII.sheet,
    borderTopWidth: 1,
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.xxxl,
    overflow: 'hidden',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.headline,
    fontSize: 18,
    fontWeight: '700',
  },
  iconScroll: {
    maxHeight: 380,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    paddingBottom: SPACING.lg,
  },
  iconGridItem: {
    width: 52,
    height: 52,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
});
