import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Habit, HabitType } from '../types/habit';
import { useAppTheme } from '../constants/useAppTheme';
import { HABIT_COLORS, SPACING, RADII, TYPOGRAPHY, TOUCH_TARGET } from '../constants/theme';
import { IconPicker } from './IconPicker';
import { triggerHaptic } from '../services/haptics';

interface HabitSheetProps {
  visible: boolean;
  habitToEdit?: Habit | null;
  onClose: () => void;
  onSave: (habitData: Omit<Habit, 'id' | 'createdAt' | 'sortOrder'>) => void;
}

const WEEKDAY_NAMES = [
  { day: 0, label: 'Sun', short: 'S' },
  { day: 1, label: 'Mon', short: 'M' },
  { day: 2, label: 'Tue', short: 'T' },
  { day: 3, label: 'Wed', short: 'W' },
  { day: 4, label: 'Thu', short: 'T' },
  { day: 5, label: 'Fri', short: 'F' },
  { day: 6, label: 'Sat', short: 'S' },
];

export const HabitSheet: React.FC<HabitSheetProps> = ({
  visible,
  habitToEdit,
  onClose,
  onSave,
}) => {
  const { theme } = useAppTheme();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('barbell');
  const [color, setColor] = useState(HABIT_COLORS[0].hex);
  const [type, setType] = useState<HabitType>('check');
  const [target, setTarget] = useState('1');
  const [scheduledDays, setScheduledDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [hasReminder, setHasReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState('08:00');

  const translateY = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      if (habitToEdit) {
        setName(habitToEdit.name);
        setIcon(habitToEdit.icon);
        setColor(habitToEdit.color);
        setType(habitToEdit.type);
        setTarget(String(habitToEdit.target));
        setScheduledDays(habitToEdit.scheduledDays);
        setHasReminder(!!habitToEdit.reminderTime);
        setReminderTime(habitToEdit.reminderTime || '08:00');
      } else {
        setName('');
        setIcon('barbell');
        setColor(HABIT_COLORS[0].hex);
        setType('check');
        setTarget('1');
        setScheduledDays([0, 1, 2, 3, 4, 5, 6]);
        setHasReminder(false);
        setReminderTime('08:00');
      }
      translateY.value = 0;
    }
  }, [visible, habitToEdit]);

  const dismissModal = () => {
    onClose();
  };

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      'worklet';
      if (e.translationY > 0) {
        // Dragging down to dismiss
        translateY.value = e.translationY;
      } else {
        // Rubber band overscroll upward
        translateY.value = e.translationY * 0.2;
      }
    })
    .onEnd((e) => {
      'worklet';
      if (e.translationY > 120 || e.velocityY > 600) {
        translateY.value = withTiming(600, { duration: 200 }, () => {
          runOnJS(dismissModal)();
        });
      } else {
        translateY.value = withSpring(0, { damping: 16 });
      }
    });

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleToggleDay = (dayIndex: number) => {
    triggerHaptic.selection();
    if (scheduledDays.includes(dayIndex)) {
      if (scheduledDays.length > 1) {
        setScheduledDays(scheduledDays.filter((d) => d !== dayIndex));
      }
    } else {
      setScheduledDays([...scheduledDays, dayIndex].sort());
    }
  };

  const handleSelectType = (selectedType: HabitType) => {
    triggerHaptic.selection();
    setType(selectedType);
    if (selectedType === 'check') {
      setTarget('1');
    } else if (selectedType === 'count' && target === '1') {
      setTarget('2');
    } else if (selectedType === 'minutes' && target === '1') {
      setTarget('30');
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;
    triggerHaptic.success();

    const parsedTarget = Math.max(1, parseInt(target, 10) || 1);
    onSave({
      name: name.trim(),
      icon,
      color,
      type,
      target: parsedTarget,
      scheduledDays,
      reminderTime: hasReminder ? reminderTime : null,
    });
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={Platform.OS !== 'ios'}
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'overFullScreen'}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <Animated.View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
            sheetAnimatedStyle,
          ]}
        >
          {/* Drag Handle */}
          <GestureDetector gesture={panGesture}>
            <View style={styles.handleContainer}>
              <View style={[styles.handleBar, { backgroundColor: theme.borderLight }]} />
            </View>
          </GestureDetector>

          {/* Sheet Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>
              {habitToEdit ? 'Edit Habit' : 'New Habit'}
            </Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeBtn,
                { backgroundColor: pressed ? theme.surfaceHighlight : 'transparent' },
              ]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={22} color={theme.textMuted} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={styles.formScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Habit Name Input */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
                Habit Name *
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    color: theme.text,
                    backgroundColor: theme.elevated,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="e.g. Read 20 pages, Morning Jog"
                placeholderTextColor={theme.textSubtle}
                value={name}
                onChangeText={setName}
                autoFocus={!habitToEdit}
                maxLength={60}
              />
            </View>

            {/* Habit Type Segmented Control */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Type</Text>
              <View style={[styles.segmentContainer, { backgroundColor: theme.elevated }]}>
                {(['check', 'count', 'minutes'] as HabitType[]).map((t) => {
                  const isSelected = type === t;
                  return (
                    <Pressable
                      key={t}
                      onPress={() => handleSelectType(t)}
                      style={[
                        styles.segmentButton,
                        {
                          backgroundColor: isSelected ? theme.accent : 'transparent',
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Type ${t}`}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          {
                            color: isSelected ? '#FFFFFF' : theme.textMuted,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {t === 'check' ? 'Yes / No' : t === 'count' ? 'Count' : 'Minutes'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Target Value (if count or minutes) */}
            {type !== 'check' && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
                  Daily Target ({type === 'minutes' ? 'Minutes' : 'Times'})
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      color: theme.text,
                      backgroundColor: theme.elevated,
                      borderColor: theme.border,
                    },
                  ]}
                  keyboardType="number-pad"
                  value={target}
                  onChangeText={setTarget}
                  maxLength={4}
                />
              </View>
            )}

            {/* Habit Color Palette (10 colors) */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Color</Text>
              <View style={styles.colorPaletteRow}>
                {HABIT_COLORS.map((c) => {
                  const isSelected = color === c.hex;
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => {
                        triggerHaptic.selection();
                        setColor(c.hex);
                      }}
                      style={[
                        styles.colorCircle,
                        {
                          backgroundColor: c.hex,
                          borderColor: isSelected ? '#FFFFFF' : 'transparent',
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Color ${c.name}`}
                    >
                      {isSelected && (
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color={c.contrastText}
                        />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Scheduled Days */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
                Scheduled Days
              </Text>
              <View style={styles.daysRow}>
                {WEEKDAY_NAMES.map((d) => {
                  const isScheduled = scheduledDays.includes(d.day);
                  return (
                    <Pressable
                      key={d.day}
                      onPress={() => handleToggleDay(d.day)}
                      style={[
                        styles.dayToggle,
                        {
                          backgroundColor: isScheduled ? color : theme.elevated,
                          borderColor: isScheduled ? color : theme.border,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={d.label}
                    >
                      <Text
                        style={[
                          styles.dayToggleText,
                          {
                            color: isScheduled ? '#FFFFFF' : theme.textMuted,
                            fontWeight: isScheduled ? '700' : '500',
                          },
                        ]}
                      >
                        {d.short}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Reminder Setting */}
            <View style={[styles.section, styles.reminderRow]}>
              <View style={styles.reminderLabelWrap}>
                <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>
                  Daily Reminder
                </Text>
                <Text style={[styles.reminderSubtitle, { color: theme.textMuted }]}>
                  Scheduled notifications on device
                </Text>
              </View>
              <Switch
                value={hasReminder}
                onValueChange={(val) => {
                  triggerHaptic.light();
                  setHasReminder(val);
                }}
                trackColor={{ false: theme.border, true: theme.accent }}
                thumbColor="#FFFFFF"
              />
            </View>

            {hasReminder && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
                  Time (HH:MM)
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      color: theme.text,
                      backgroundColor: theme.elevated,
                      borderColor: theme.border,
                    },
                  ]}
                  placeholder="08:00"
                  placeholderTextColor={theme.textSubtle}
                  value={reminderTime}
                  onChangeText={setReminderTime}
                  maxLength={5}
                />
              </View>
            )}

            {/* Icon Picker */}
            <IconPicker
              selectedIcon={icon}
              onSelectIcon={setIcon}
              accentColor={color}
            />

            {/* Save Button */}
            <Pressable
              onPress={handleSave}
              disabled={!name.trim()}
              style={({ pressed }) => [
                styles.saveButton,
                {
                  backgroundColor: !name.trim()
                    ? theme.surfaceHighlight
                    : pressed
                    ? theme.accentMuted
                    : theme.accent,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Save habit"
            >
              <Text
                style={[
                  styles.saveButtonText,
                  { color: !name.trim() ? theme.textSubtle : '#FFFFFF' },
                ]}
              >
                {habitToEdit ? 'Save Changes' : 'Create Habit'}
              </Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheetContainer: {
    width: '100%',
    maxHeight: '90%',
    maxWidth: 560,
    alignSelf: 'center',
    borderTopLeftRadius: RADII.sheet,
    borderTopRightRadius: RADII.sheet,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  handleBar: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.title2,
    fontSize: 22,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formScroll: {
    flexGrow: 0,
  },
  formScrollContent: {
    paddingBottom: SPACING.xxxl,
  },
  section: {
    marginVertical: SPACING.sm,
  },
  sectionTitle: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: SPACING.xs,
  },
  textInput: {
    ...TYPOGRAPHY.body,
    fontSize: 16,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.base,
    borderRadius: RADII.card,
    borderWidth: 1,
    minHeight: TOUCH_TARGET,
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: RADII.card,
    padding: 3,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  segmentText: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
  },
  colorPaletteRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  dayToggle: {
    flex: 1,
    height: 42,
    borderRadius: RADII.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayToggleText: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
  },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  reminderLabelWrap: {
    flex: 1,
  },
  reminderSubtitle: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    marginTop: 2,
  },
  saveButton: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.base,
    borderRadius: RADII.card,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TOUCH_TARGET,
  },
  saveButtonText: {
    ...TYPOGRAPHY.headline,
    fontWeight: '700',
  },
});
