import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../constants/useAppTheme';
import { SPACING, RADII, TYPOGRAPHY, TOUCH_TARGET } from '../constants/theme';
import { triggerHaptic } from '../services/haptics';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  const { theme } = useAppTheme();

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <Pressable style={styles.backdrop} onPress={onCancel} />

        <View
          style={[
            styles.dialogCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          {/* Icon Header */}
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: isDestructive
                  ? 'rgba(239, 68, 68, 0.12)'
                  : theme.surfaceHighlight,
              },
            ]}
          >
            <Ionicons
              name={isDestructive ? 'trash-outline' : 'alert-circle-outline'}
              size={26}
              color={isDestructive ? theme.danger : theme.accent}
            />
          </View>

          {/* Title & Message */}
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.message, { color: theme.textMuted }]}>{message}</Text>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <Pressable
              onPress={() => {
                triggerHaptic.light();
                onCancel();
              }}
              style={({ pressed }) => [
                styles.cancelButton,
                {
                  backgroundColor: pressed ? theme.surfaceHighlight : theme.elevated,
                  borderColor: theme.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
            >
              <Text style={[styles.cancelButtonText, { color: theme.text }]}>
                {cancelLabel}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                triggerHaptic.heavy();
                onConfirm();
              }}
              style={({ pressed }) => [
                styles.confirmButton,
                {
                  backgroundColor: isDestructive
                    ? pressed
                      ? '#DC2626'
                      : theme.danger
                    : pressed
                    ? theme.accentMuted
                    : theme.accent,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
            >
              <Text style={styles.confirmButtonText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: RADII.card,
    borderWidth: 1,
    padding: SPACING.lg,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.title2,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  message: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TOUCH_TARGET,
    borderRadius: RADII.md,
    borderWidth: 1,
  },
  cancelButtonText: {
    ...TYPOGRAPHY.headline,
    fontSize: 15,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TOUCH_TARGET,
    borderRadius: RADII.md,
  },
  confirmButtonText: {
    ...TYPOGRAPHY.headline,
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
