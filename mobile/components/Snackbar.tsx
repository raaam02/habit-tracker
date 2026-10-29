import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../constants/useAppTheme';
import { useHabitStore } from '../store/habitStore';
import { SPACING, RADII, TYPOGRAPHY } from '../constants/theme';
import { triggerHaptic } from '../services/haptics';

export const Snackbar: React.FC = () => {
  const { theme } = useAppTheme();
  const undoRecord = useHabitStore((state) => state.undoRecord);
  const undoLastAction = useHabitStore((state) => state.undoLastAction);
  const clearUndo = useHabitStore((state) => state.clearUndo);
  const habits = useHabitStore((state) => state.habits);

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  const habit = habits.find((h) => h.id === undoRecord?.habitId);

  useEffect(() => {
    if (undoRecord) {
      // Animate in
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Dismiss automatically after 5000ms
      const timer = setTimeout(() => {
        dismiss();
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      opacity.setValue(0);
      translateY.setValue(20);
    }
  }, [undoRecord]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 20,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      clearUndo();
    });
  };

  const handleUndo = () => {
    triggerHaptic.medium();
    undoLastAction();
    dismiss();
  };

  if (!undoRecord) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.elevated,
          borderColor: theme.borderLight,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.content}>
        <Ionicons name="checkmark-circle" size={18} color={theme.success} style={styles.icon} />
        <Text style={[styles.text, { color: theme.text }]} numberOfLines={1}>
          Updated <Text style={styles.habitName}>{habit?.name || 'Habit'}</Text>
        </Text>
      </View>
      <Pressable
        onPress={handleUndo}
        style={({ pressed }) => [
          styles.undoButton,
          { backgroundColor: pressed ? theme.surfaceHighlight : theme.accentMuted },
        ]}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Undo habit completion"
      >
        <Text style={[styles.undoText, { color: theme.accent }]}>Undo</Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 84, // positioned nicely above the bottom tab bar
    left: SPACING.base,
    right: SPACING.base,
    maxWidth: 520,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.base,
    borderRadius: RADII.card,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 999,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  icon: {
    marginRight: SPACING.sm,
  },
  text: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    flexShrink: 1,
  },
  habitName: {
    fontWeight: '600',
  },
  undoButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADII.sm,
  },
  undoText: {
    ...TYPOGRAPHY.headline,
    fontSize: 14,
    fontWeight: '700',
  },
});
