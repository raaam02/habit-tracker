import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useAppTheme } from '../constants/useAppTheme';
import { HABIT_COLORS, SPACING, RADII, TYPOGRAPHY } from '../constants/theme';
import { triggerHaptic } from '../services/haptics';

export interface ColorPickerModalProps {
  visible: boolean;
  selectedColor: string;
  onSelectColor: (hex: string) => void;
  onClose: () => void;
}

export const ColorPickerModal: React.FC<ColorPickerModalProps> = ({
  visible,
  selectedColor,
  onSelectColor,
  onClose,
}) => {
  const { theme, isDark } = useAppTheme();

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
            <Text style={[styles.title, { color: theme.text }]}>Choose color</Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close color picker"
            >
              <Ionicons name="close" size={22} color={theme.textMuted} />
            </Pressable>
          </View>

          <View style={styles.colorPaletteGrid}>
            {HABIT_COLORS.map((c) => {
              const isSelected = selectedColor.toLowerCase() === c.hex.toLowerCase();
              return (
                <Pressable
                  key={c.id}
                  onPress={() => {
                    triggerHaptic.selection();
                    onSelectColor(c.hex);
                    onClose();
                  }}
                  style={({ pressed }) => [
                    styles.colorChoiceRow,
                    {
                      backgroundColor: isSelected ? `${c.hex}18` : theme.elevated,
                      borderColor: isSelected ? c.hex : theme.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={c.name}
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={[styles.colorSwatchCircle, { backgroundColor: c.hex }]}>
                    {isSelected && (
                      <Ionicons name="checkmark" size={15} color={c.contrastText} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.colorChoiceName,
                      {
                        color: isSelected ? theme.text : theme.textMuted,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {c.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
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
  colorPaletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    justifyContent: 'space-between',
  },
  colorChoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    paddingVertical: 10,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADII.md,
    borderWidth: 1,
    gap: 8,
  },
  colorSwatchCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorChoiceName: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
  },
});
