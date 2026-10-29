import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Habit } from '../types/habit';
import { useAppTheme } from '../constants/useAppTheme';
import { SPACING, RADII, TYPOGRAPHY, TOUCH_TARGET } from '../constants/theme';
import { triggerHaptic } from '../services/haptics';

interface NumberInputModalProps {
  visible: boolean;
  habit: Habit | null;
  currentValue: number;
  onClose: () => void;
  onSave: (value: number) => void;
}

export const NumberInputModal: React.FC<NumberInputModalProps> = ({
  visible,
  habit,
  currentValue,
  onClose,
  onSave,
}) => {
  const { theme } = useAppTheme();
  const [val, setVal] = useState<string>(String(currentValue || 0));

  useEffect(() => {
    if (visible && habit) {
      setVal(String(currentValue || 0));
    }
  }, [visible, habit, currentValue]);

  if (!habit) return null;

  const isMinutes = habit.type === 'minutes';
  const quickOptions = isMinutes ? [15, 30, 45, 60] : [1, 2, 5, 10];

  const handleQuickAdd = (amount: number) => {
    triggerHaptic.light();
    const currentNum = parseInt(val, 10) || 0;
    const nextVal = currentNum + amount;
    setVal(String(nextVal));
  };

  const handleQuickSet = (value: number) => {
    triggerHaptic.light();
    setVal(String(value));
  };

  const handleSave = () => {
    triggerHaptic.success();
    const parsed = Math.max(0, parseInt(val, 10) || 0);
    onSave(parsed);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.overlay, { backgroundColor: theme.overlay }]}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.elevated,
              borderColor: theme.borderLight,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: theme.text }]}>
                Log {habit.name}
              </Text>
              <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                Target: {habit.target} {isMinutes ? 'minutes' : 'times'}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                { backgroundColor: pressed ? theme.surfaceHighlight : 'transparent' },
              ]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={20} color={theme.textMuted} />
            </Pressable>
          </View>

          {/* Value Display & Input */}
          <View style={styles.inputRow}>
            <TextInput
              style={[
                styles.input,
                {
                  color: theme.text,
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
              keyboardType="number-pad"
              value={val}
              onChangeText={setVal}
              selectTextOnFocus
              maxLength={5}
            />
            <Text style={[styles.unitText, { color: theme.textMuted }]}>
              {isMinutes ? 'min' : 'reps'}
            </Text>
          </View>

          {/* Quick presets */}
          <View style={styles.presetsRow}>
            {quickOptions.map((opt) => (
              <Pressable
                key={opt}
                onPress={() => (isMinutes ? handleQuickSet(opt) : handleQuickAdd(opt))}
                style={({ pressed }) => [
                  styles.presetChip,
                  {
                    backgroundColor: pressed ? theme.surfaceHighlight : theme.surface,
                    borderColor: theme.border,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${isMinutes ? 'Set' : 'Add'} ${opt} ${isMinutes ? 'minutes' : ''}`}
              >
                <Text style={[styles.presetText, { color: theme.accent }]}>
                  {isMinutes ? `${opt}m` : `+${opt}`}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Save button */}
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              styles.saveButton,
              {
                backgroundColor: pressed ? theme.accentMuted : theme.accent,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Save value"
          >
            <Text style={styles.saveButtonText}>Save Progress</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.base,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    borderRadius: RADII.sheet,
    padding: SPACING.xl,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.title2,
    fontSize: 20,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.base,
  },
  input: {
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADII.card,
    borderWidth: 1,
    minWidth: 120,
  },
  unitText: {
    ...TYPOGRAPHY.headline,
    fontSize: 18,
    marginLeft: SPACING.sm,
  },
  presetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginVertical: SPACING.base,
  },
  presetChip: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADII.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TOUCH_TARGET,
  },
  presetText: {
    ...TYPOGRAPHY.headline,
    fontSize: 15,
  },
  saveButton: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.base,
    borderRadius: RADII.card,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TOUCH_TARGET,
  },
  saveButtonText: {
    ...TYPOGRAPHY.headline,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
