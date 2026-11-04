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
import { BlurView } from 'expo-blur';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  FadeInDown,
  FadeOutUp,
} from 'react-native-reanimated';
import { Habit, HabitType } from '../types/habit';
import { useAppTheme } from '../constants/useAppTheme';
import { HABIT_COLORS, SPACING, RADII, TYPOGRAPHY } from '../constants/theme';
import { triggerHaptic } from '../services/haptics';
import { SegmentedControl } from './SegmentedControl';
import { WeekdaySelector } from './WeekdaySelector';
import { ColorPickerModal } from './ColorPickerModal';
import { IconPickerModal } from './IconPickerModal';

interface HabitSheetProps {
  visible: boolean;
  habitToEdit?: Habit | null;
  onClose: () => void;
  onSave: (habitData: Omit<Habit, 'id' | 'createdAt' | 'sortOrder'>) => void;
}

export const HabitSheet: React.FC<HabitSheetProps> = ({
  visible,
  habitToEdit,
  onClose,
  onSave,
}) => {
  const { theme, isDark } = useAppTheme();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('barbell');
  const [color, setColor] = useState(HABIT_COLORS[0].hex);
  const [type, setType] = useState<HabitType>('check');
  const [target, setTarget] = useState('1');
  const [scheduledDays, setScheduledDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [hasReminder, setHasReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [reminderDate, setReminderDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(8, 0, 0, 0);
    return d;
  });

  // Sheet-over-sheet states for Icon and Color selection
  const [showIconSheet, setShowIconSheet] = useState(false);
  const [showColorSheet, setShowColorSheet] = useState(false);

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
        const timeStr = habitToEdit.reminderTime || '08:00';
        setReminderTime(timeStr);
        const [h, m] = timeStr.split(':').map(Number);
        const d = new Date();
        d.setHours(isNaN(h) ? 8 : h, isNaN(m) ? 0 : m, 0, 0);
        setReminderDate(d);
      } else {
        setName('');
        setIcon('barbell');
        setColor(HABIT_COLORS[0].hex);
        setType('check');
        setTarget('1');
        setScheduledDays([0, 1, 2, 3, 4, 5, 6]);
        setHasReminder(false);
        setReminderTime('08:00');
        const d = new Date();
        d.setHours(8, 0, 0, 0);
        setReminderDate(d);
      }
      translateY.value = 0;
    }
  }, [visible, habitToEdit, translateY]);

  const dismissModal = () => {
    onClose();
  };

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      'worklet';
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      'worklet';
      if (e.translationY > 120 || e.velocityY > 500) {
        translateY.value = withTiming(600, { duration: 180 }, () => {
          runOnJS(dismissModal)();
        });
      } else {
        translateY.value = withTiming(0, { duration: 160 });
      }
    });

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleToggleDay = (dayIndex: number) => {
    if (scheduledDays.includes(dayIndex)) {
      if (scheduledDays.length > 1) {
        setScheduledDays(scheduledDays.filter((d) => d !== dayIndex));
      }
    } else {
      setScheduledDays([...scheduledDays, dayIndex].sort());
    }
  };

  const handleSelectType = (selectedType: HabitType) => {
    setType(selectedType);
    if (selectedType === 'check') {
      setTarget('1');
    } else if (selectedType === 'count' && target === '1') {
      setTarget('2');
    } else if (selectedType === 'minutes' && target === '1') {
      setTarget('30');
    }
  };

  const handleNativeTimeChange = (_event: any, selected?: Date) => {
    if (selected) {
      setReminderDate(selected);
      const hours = String(selected.getHours()).padStart(2, '0');
      const minutes = String(selected.getMinutes()).padStart(2, '0');
      setReminderTime(`${hours}:${minutes}`);
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

  const currentColorObj =
    HABIT_COLORS.find((c) => c.hex.toLowerCase() === color.toLowerCase()) || HABIT_COLORS[0];

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <Animated.View
          style={[
            styles.sheetContainer,
            {
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            },
            sheetAnimatedStyle,
          ]}
        >
          {/* Native Glass Blur Background */}
          {Platform.OS === 'ios' ? (
            <BlurView
              intensity={80}
              tint={isDark ? 'systemMaterialDark' : 'systemMaterialLight'}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.surface }]} />
          )}

          {/* Drag Handle */}
          <GestureDetector gesture={panGesture}>
            <View style={styles.handleContainer}>
              <View style={[styles.handleBar, { backgroundColor: theme.borderLight }]} />
            </View>
          </GestureDetector>

          {/* Minimal Sheet Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>
              {habitToEdit ? 'Edit habit' : 'New habit'}
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
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Minimal Habit Name & Icon preview row */}
            <View style={styles.nameRow}>
              <TextInput
                style={[
                  styles.nameInput,
                  {
                    color: theme.text,
                    backgroundColor: theme.elevated,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="Habit name (e.g. Read 20 pages)"
                placeholderTextColor={theme.textSubtle}
                value={name}
                onChangeText={setName}
                autoFocus={!habitToEdit}
                maxLength={60}
              />
              <Pressable
                onPress={() => {
                  triggerHaptic.selection();
                  setShowIconSheet(true);
                }}
                style={({ pressed }) => [
                  styles.iconBadgeBtn,
                  {
                    backgroundColor: `${color}18`,
                    borderColor: color,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Choose icon"
              >
                <Ionicons name={icon as any} size={22} color={color} />
                <View style={[styles.iconEditDot, { backgroundColor: color }]}>
                  <Ionicons name="pencil" size={8} color="#FFFFFF" />
                </View>
              </Pressable>
            </View>

            {/* Reusable Type Segmented Control */}
            <SegmentedControl
              options={[
                { value: 'check', label: 'Yes / No' },
                { value: 'count', label: 'Count' },
                { value: 'minutes', label: 'Minutes' },
              ]}
              value={type}
              onChange={handleSelectType}
              style={styles.segmentWrap}
            />

            {/* Target Value Input */}
            {type !== 'check' && (
              <Animated.View
                entering={FadeInDown.duration(200)}
                exiting={FadeOutUp.duration(150)}
                style={styles.fieldWrap}
              >
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      color: theme.text,
                      backgroundColor: theme.elevated,
                      borderColor: theme.border,
                    },
                  ]}
                  placeholder={`Daily target (${type === 'minutes' ? 'minutes' : 'times'})`}
                  placeholderTextColor={theme.textSubtle}
                  keyboardType="number-pad"
                  value={target}
                  onChangeText={setTarget}
                  maxLength={4}
                />
              </Animated.View>
            )}

            {/* Minimal Color Selector Pill */}
            <Pressable
              onPress={() => {
                triggerHaptic.selection();
                setShowColorSheet(true);
              }}
              style={({ pressed }) => [
                styles.colorPickerButton,
                {
                  backgroundColor: theme.elevated,
                  borderColor: theme.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Choose color"
            >
              <View style={styles.colorButtonLeft}>
                <View style={[styles.selectedColorCircle, { backgroundColor: color }]} />
                <Text style={[styles.colorButtonText, { color: theme.text }]}>
                  {currentColorObj.name}
                </Text>
              </View>
              <View style={styles.colorButtonRight}>
                <Text style={[styles.colorChangeLabel, { color: theme.accent }]}>Change</Text>
                <Ionicons name="chevron-forward" size={15} color={theme.accent} />
              </View>
            </Pressable>

            {/* Reusable Scheduled Days Selector */}
            <View style={styles.daysContainer}>
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Repeat on</Text>
              <WeekdaySelector
                scheduledDays={scheduledDays}
                onToggleDay={handleToggleDay}
                activeColor={color}
              />
            </View>

            {/* Daily Reminder Setting */}
            <View style={styles.reminderRow}>
              <View style={styles.reminderLabelWrap}>
                <Text style={[styles.reminderTitle, { color: theme.text }]}>
                  Daily reminder
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
              <Animated.View
                entering={FadeInDown.duration(200)}
                exiting={FadeOutUp.duration(150)}
                style={styles.timePickerContainer}
              >
                {Platform.OS === 'ios' ? (
                  <View style={styles.iosPickerRow}>
                    <Text style={[styles.timeLabel, { color: theme.textMuted }]}>
                      Reminder time
                    </Text>
                    <DateTimePicker
                      value={reminderDate}
                      mode="time"
                      display="compact"
                      themeVariant={isDark ? 'dark' : 'light'}
                      onChange={handleNativeTimeChange}
                    />
                  </View>
                ) : (
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        color: theme.text,
                        backgroundColor: theme.elevated,
                        borderColor: theme.border,
                      },
                    ]}
                    placeholder="Reminder time (HH:MM)"
                    placeholderTextColor={theme.textSubtle}
                    value={reminderTime}
                    onChangeText={setReminderTime}
                    maxLength={5}
                  />
                )}
              </Animated.View>
            )}

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
                {habitToEdit ? 'Save changes' : 'Create habit'}
              </Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>

      {/* Reusable Icon Picker Modal */}
      <IconPickerModal
        visible={showIconSheet}
        selectedIcon={icon}
        activeColor={color}
        onSelectIcon={setIcon}
        onClose={() => setShowIconSheet(false)}
      />

      {/* Reusable Color Picker Modal */}
      <ColorPickerModal
        visible={showColorSheet}
        selectedColor={color}
        onSelectColor={setColor}
        onClose={() => setShowColorSheet(false)}
      />
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
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheetContainer: {
    width: '100%',
    maxHeight: '92%',
    maxWidth: 520,
    alignSelf: 'center',
    borderTopLeftRadius: RADII.sheet,
    borderTopRightRadius: RADII.sheet,
    borderTopWidth: 1,
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
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.xs,
  },
  title: {
    ...TYPOGRAPHY.title2,
    fontSize: 20,
    fontWeight: '700',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formScroll: {
    paddingHorizontal: SPACING.base,
  },
  formScrollContent: {
    paddingBottom: SPACING.xxxl,
    gap: SPACING.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  nameInput: {
    flex: 1,
    height: 48,
    borderRadius: RADII.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.base,
    fontSize: 16,
    fontWeight: '500',
  },
  iconBadgeBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconEditDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentWrap: {
    marginVertical: 2,
  },
  fieldWrap: {
    width: '100%',
  },
  textInput: {
    height: 48,
    borderRadius: RADII.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.base,
    fontSize: 15,
  },
  colorPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    height: 48,
    borderRadius: RADII.md,
    borderWidth: 1,
  },
  colorButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectedColorCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  colorButtonText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
  colorButtonRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  colorChangeLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
  },
  daysContainer: {
    gap: 8,
  },
  fieldLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
    fontWeight: '600',
  },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  reminderLabelWrap: {
    flex: 1,
    marginRight: SPACING.base,
  },
  reminderTitle: {
    ...TYPOGRAPHY.body,
    fontSize: 15,
    fontWeight: '600',
  },
  reminderSubtitle: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    marginTop: 2,
  },
  timePickerContainer: {
    width: '100%',
  },
  iosPickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  timeLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 14,
  },
  saveButton: {
    height: 52,
    borderRadius: RADII.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  saveButtonText: {
    ...TYPOGRAPHY.headline,
    fontSize: 16,
    fontWeight: '700',
  },
});
