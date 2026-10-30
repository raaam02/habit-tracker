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
  FadeInDown,
  FadeOutUp,
  LinearTransition,
} from 'react-native-reanimated';
import { Habit, HabitType } from '../types/habit';
import { useAppTheme } from '../constants/useAppTheme';
import { HABIT_COLORS, SPACING, RADII, TYPOGRAPHY, TOUCH_TARGET } from '../constants/theme';
import { CURATED_ICONS } from './IconPicker';
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

  // Modals for Icon and Color selection
  const [showIconModal, setShowIconModal] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);

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
        translateY.value = e.translationY;
      } else {
        translateY.value = e.translationY * 0.15;
      }
    })
    .onEnd((e) => {
      'worklet';
      if (e.translationY > 120 || e.velocityY > 500) {
        translateY.value = withTiming(600, { duration: 180 }, () => {
          runOnJS(dismissModal)();
        });
      } else {
        translateY.value = withSpring(0, { damping: 25, stiffness: 220 });
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

  const currentColorObj =
    HABIT_COLORS.find((c) => c.hex.toLowerCase() === color.toLowerCase()) || HABIT_COLORS[0];

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
            {/* Habit Name & Icon preview row */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
                Habit name
              </Text>
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
                  placeholder="e.g. Read 20 pages, Gym workout"
                  placeholderTextColor={theme.textSubtle}
                  value={name}
                  onChangeText={setName}
                  autoFocus={!habitToEdit}
                  maxLength={60}
                />
                <Pressable
                  onPress={() => {
                    triggerHaptic.selection();
                    setShowIconModal(true);
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
                  accessibilityLabel="Change icon"
                >
                  <Ionicons name={icon as any} size={22} color={color} />
                  <View style={[styles.iconEditDot, { backgroundColor: color }]}>
                    <Ionicons name="pencil" size={8} color="#FFFFFF" />
                  </View>
                </Pressable>
              </View>
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

            {/* Target Value with Smooth Emil Kowalski Layout Transition */}
            {type !== 'check' && (
              <Animated.View
                entering={FadeInDown.duration(200)}
                exiting={FadeOutUp.duration(150)}
                style={styles.section}
              >
                <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
                  Daily target ({type === 'minutes' ? 'minutes' : 'times'})
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
              </Animated.View>
            )}

            {/* Color Selector Pill (Opens Palette Modal) */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Color</Text>
              <Pressable
                onPress={() => {
                  triggerHaptic.selection();
                  setShowColorModal(true);
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
            </View>

            {/* Scheduled Days */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
                Scheduled days
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

            {/* Daily Reminder Setting */}
            <View style={[styles.section, styles.reminderRow]}>
              <View style={styles.reminderLabelWrap}>
                <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>
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
                style={styles.section}
              >
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

      {/* Icon Picker Dialog Modal */}
      <Modal
        visible={showIconModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowIconModal(false)}
      >
        <View style={[styles.subModalOverlay, { backgroundColor: theme.overlay }]}>
          <Pressable style={styles.backdrop} onPress={() => setShowIconModal(false)} />
          <View
            style={[
              styles.subModalCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.subModalHeader}>
              <Text style={[styles.subModalTitle, { color: theme.text }]}>Choose icon</Text>
              <Pressable
                onPress={() => setShowIconModal(false)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close icon picker"
              >
                <Ionicons name="close" size={20} color={theme.textMuted} />
              </Pressable>
            </View>

            <ScrollView style={styles.iconGridScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.iconGrid}>
                {CURATED_ICONS.map((iconName) => {
                  const isSelected = icon === iconName;
                  return (
                    <Pressable
                      key={iconName}
                      onPress={() => {
                        triggerHaptic.selection();
                        setIcon(iconName);
                        setShowIconModal(false);
                      }}
                      style={({ pressed }) => [
                        styles.iconGridItem,
                        {
                          backgroundColor: isSelected
                            ? `${color}25`
                            : pressed
                            ? theme.surfaceHighlight
                            : theme.elevated,
                          borderColor: isSelected ? color : 'transparent',
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Select ${iconName}`}
                    >
                      <Ionicons
                        name={iconName as any}
                        size={22}
                        color={isSelected ? color : theme.text}
                      />
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Color Picker Dialog Modal */}
      <Modal
        visible={showColorModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowColorModal(false)}
      >
        <View style={[styles.subModalOverlay, { backgroundColor: theme.overlay }]}>
          <Pressable style={styles.backdrop} onPress={() => setShowColorModal(false)} />
          <View
            style={[
              styles.subModalCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.subModalHeader}>
              <Text style={[styles.subModalTitle, { color: theme.text }]}>Choose color</Text>
              <Pressable
                onPress={() => setShowColorModal(false)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close color picker"
              >
                <Ionicons name="close" size={20} color={theme.textMuted} />
              </Pressable>
            </View>

            <View style={styles.colorPaletteGrid}>
              {HABIT_COLORS.map((c) => {
                const isSelected = color.toLowerCase() === c.hex.toLowerCase();
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => {
                      triggerHaptic.selection();
                      setColor(c.hex);
                      setShowColorModal(false);
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
                    accessibilityLabel={`Choose ${c.name}`}
                  >
                    <View style={[styles.colorSwatchCircle, { backgroundColor: c.hex }]}>
                      {isSelected && (
                        <Ionicons name="checkmark" size={15} color={c.contrastText} />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.colorChoiceName,
                        { color: isSelected ? theme.text : theme.textMuted, fontWeight: isSelected ? '700' : '500' },
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
    borderTopLeftRadius: RADII.sheet,
    borderTopRightRadius: RADII.sheet,
    borderTopWidth: 1,
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.xl,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  handleBar: {
    width: 36,
    height: 5,
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.sm,
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
    maxHeight: 520,
  },
  formScrollContent: {
    paddingBottom: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  nameInput: {
    flex: 1,
    ...TYPOGRAPHY.body,
    fontSize: 16,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADII.md,
    borderWidth: 1,
    minHeight: TOUCH_TARGET,
  },
  iconBadgeBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconEditDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  textInput: {
    ...TYPOGRAPHY.body,
    fontSize: 16,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADII.md,
    borderWidth: 1,
    minHeight: TOUCH_TARGET,
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: RADII.md,
    padding: 3,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.sm,
    minHeight: 38,
  },
  segmentText: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
  },
  colorPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADII.md,
    borderWidth: 1,
    minHeight: TOUCH_TARGET,
  },
  colorButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  selectedColorCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  colorButtonText: {
    ...TYPOGRAPHY.headline,
    fontSize: 14,
    fontWeight: '600',
  },
  colorButtonRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  colorChangeLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
    fontWeight: '600',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  dayToggle: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: RADII.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxHeight: 44,
  },
  dayToggleText: {
    ...TYPOGRAPHY.headline,
    fontSize: 13,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    marginTop: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TOUCH_TARGET,
  },
  saveButtonText: {
    ...TYPOGRAPHY.headline,
    fontSize: 16,
    fontWeight: '600',
  },
  subModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.base,
  },
  subModalCard: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: RADII.card,
    borderWidth: 1,
    padding: SPACING.base,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 16,
  },
  subModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  subModalTitle: {
    ...TYPOGRAPHY.title2,
    fontSize: 18,
    fontWeight: '700',
  },
  iconGridScroll: {
    maxHeight: 340,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    justifyContent: 'space-between',
    paddingBottom: SPACING.sm,
  },
  iconGridItem: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: RADII.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorPaletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    justifyContent: 'space-between',
  },
  colorChoiceRow: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADII.md,
    borderWidth: 1,
  },
  colorSwatchCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorChoiceName: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
  },
});
