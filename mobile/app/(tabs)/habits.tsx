import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Alert,
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
  LinearTransition,
} from 'react-native-reanimated';
import { useAppTheme } from '../../constants/useAppTheme';
import { useHabitStore } from '../../store/habitStore';
import { Habit } from '../../types/habit';
import { HabitSheet } from '../../components/HabitSheet';
import { HabitDetailModal } from '../../components/HabitDetailModal';
import { EmptyState } from '../../components/EmptyState';
import { SPACING, RADII, TYPOGRAPHY, SPRING_CONFIG } from '../../constants/theme';
import { triggerHaptic } from '../../services/haptics';

interface DraggableHabitItemProps {
  habit: Habit;
  index: number;
  total: number;
  onSwap: (fromIndex: number, toIndex: number) => void;
  onPress: () => void;
  onEdit: () => void;
  onArchive: () => void;
}

const DraggableHabitItem: React.FC<DraggableHabitItemProps> = ({
  habit,
  index,
  total,
  onSwap,
  onPress,
  onEdit,
  onArchive,
}) => {
  const { theme } = useAppTheme();
  const translateY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const dragGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      isDragging.value = true;
      runOnJS(triggerHaptic.medium)();
    })
    .onUpdate((event) => {
      'worklet';
      translateY.value = event.translationY;

      // Swap threshold ~54px per row
      if (event.translationY > 50 && index < total - 1) {
        runOnJS(onSwap)(index, index + 1);
        translateY.value = event.translationY - 50;
      } else if (event.translationY < -50 && index > 0) {
        runOnJS(onSwap)(index, index - 1);
        translateY.value = event.translationY + 50;
      }
    })
    .onEnd(() => {
      'worklet';
      isDragging.value = false;
      translateY.value = withSpring(0, SPRING_CONFIG);
      runOnJS(triggerHaptic.light)();
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: isDragging.value ? withSpring(1.025, SPRING_CONFIG) : withSpring(1, SPRING_CONFIG) },
    ],
    zIndex: isDragging.value ? 99 : 1,
    elevation: isDragging.value ? 8 : 0,
    shadowOpacity: isDragging.value ? 0.35 : 0,
  }));

  return (
    <Animated.View
      layout={LinearTransition.springify().damping(22).stiffness(200)}
      style={[
        styles.habitCard,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
        animatedStyle,
      ]}
    >
      {/* Drag Handle */}
      <GestureDetector gesture={dragGesture}>
        <View style={styles.dragHandle} hitSlop={10}>
          <Ionicons name="reorder-two" size={24} color={theme.textSubtle} />
        </View>
      </GestureDetector>

      {/* Habit Details */}
      <Pressable onPress={onPress} style={styles.habitMainPressable} accessibilityRole="button">
        <View style={[styles.iconWrap, { backgroundColor: `${habit.color}18` }]}>
          <Ionicons name={habit.icon as any} size={20} color={habit.color} />
        </View>

        <View style={styles.infoCol}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
            {habit.name}
          </Text>
          <Text style={[styles.scheduleText, { color: theme.textMuted }]}>
            {habit.scheduledDays.length === 7
              ? 'Every day'
              : `${habit.scheduledDays.length} days / week`}{' '}
            • {habit.type === 'check' ? 'Yes / No' : `${habit.target} target`}
          </Text>
        </View>
      </Pressable>

      {/* Quick Action buttons */}
      <View style={styles.actionsRow}>
        <Pressable
          onPress={onEdit}
          style={({ pressed }) => [
            styles.actionBtn,
            { backgroundColor: pressed ? theme.surfaceHighlight : 'transparent' },
          ]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Edit habit"
        >
          <Ionicons name="pencil" size={17} color={theme.accent} />
        </Pressable>

        <Pressable
          onPress={onArchive}
          style={({ pressed }) => [
            styles.actionBtn,
            { backgroundColor: pressed ? theme.surfaceHighlight : 'transparent' },
          ]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Archive habit"
        >
          <Ionicons name="archive-outline" size={17} color={theme.textMuted} />
        </Pressable>
      </View>
    </Animated.View>
  );
};

export default function HabitsScreen() {
  const { theme } = useAppTheme();
  const habits = useHabitStore((state) => state.habits);
  const addHabit = useHabitStore((state) => state.addHabit);
  const editHabit = useHabitStore((state) => state.editHabit);
  const deleteHabit = useHabitStore((state) => state.deleteHabit);
  const archiveHabit = useHabitStore((state) => state.archiveHabit);
  const restoreHabit = useHabitStore((state) => state.restoreHabit);
  const reorderHabits = useHabitStore((state) => state.reorderHabits);

  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [detailHabit, setDetailHabit] = useState<Habit | null>(null);

  const activeHabits = habits
    .filter((h) => !h.archivedAt)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const archivedHabits = habits
    .filter((h) => !!h.archivedAt)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const handleSwap = (fromIndex: number, toIndex: number) => {
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= activeHabits.length || toIndex >= activeHabits.length) {
      return;
    }
    const updated = [...activeHabits];
    const item = updated.splice(fromIndex, 1)[0];
    updated.splice(toIndex, 0, item);
    reorderHabits(updated);
  };

  const confirmDelete = (habit: Habit) => {
    triggerHaptic.heavy();
    if (Platform.OS === 'web') {
      const ok = window.confirm(`Permanently delete "${habit.name}" and its logs?`);
      if (ok) deleteHabit(habit.id);
    } else {
      Alert.alert(
        'Delete Habit',
        `Are you sure you want to permanently delete "${habit.name}" and its logs?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => deleteHabit(habit.id),
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>Habits</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
              {activeHabits.length} active • {archivedHabits.length} archived
            </Text>
          </View>
          <Pressable
            onPress={() => {
              triggerHaptic.light();
              setEditingHabit(null);
              setSheetVisible(true);
            }}
            style={({ pressed }) => [
              styles.addBtn,
              { backgroundColor: pressed ? theme.accentMuted : theme.accent },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Add new habit"
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.addBtnText}>New habit</Text>
          </Pressable>
        </View>

        {/* Tab Segment (Active vs Archived) */}
        <View style={[styles.segmentContainer, { backgroundColor: theme.surfaceHighlight }]}>
          <Pressable
            onPress={() => {
              triggerHaptic.selection();
              setActiveTab('active');
            }}
            style={[
              styles.segmentBtn,
              { backgroundColor: activeTab === 'active' ? theme.surface : 'transparent' },
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'active' }}
          >
            <Text
              style={[
                styles.segmentLabel,
                {
                  color: activeTab === 'active' ? theme.text : theme.textMuted,
                  fontWeight: activeTab === 'active' ? '700' : '500',
                },
              ]}
            >
              Active ({activeHabits.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              triggerHaptic.selection();
              setActiveTab('archived');
            }}
            style={[
              styles.segmentBtn,
              { backgroundColor: activeTab === 'archived' ? theme.surface : 'transparent' },
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'archived' }}
          >
            <Text
              style={[
                styles.segmentLabel,
                {
                  color: activeTab === 'archived' ? theme.text : theme.textMuted,
                  fontWeight: activeTab === 'archived' ? '700' : '500',
                },
              ]}
            >
              Archived ({archivedHabits.length})
            </Text>
          </Pressable>
        </View>

        {/* Habit List */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'active' ? (
            activeHabits.length === 0 ? (
              <EmptyState
                icon="layers-outline"
                title="No active habits"
                description="Get started by creating a new habit or exploring starter templates."
                actionLabel="Create habit"
                onAction={() => {
                  setEditingHabit(null);
                  setSheetVisible(true);
                }}
              />
            ) : (
              activeHabits.map((habit, index) => (
                <DraggableHabitItem
                  key={habit.id}
                  habit={habit}
                  index={index}
                  total={activeHabits.length}
                  onSwap={handleSwap}
                  onPress={() => {
                    triggerHaptic.light();
                    setDetailHabit(habit);
                  }}
                  onEdit={() => {
                    triggerHaptic.light();
                    setEditingHabit(habit);
                    setSheetVisible(true);
                  }}
                  onArchive={() => {
                    triggerHaptic.light();
                    archiveHabit(habit.id);
                  }}
                />
              ))
            )
          ) : archivedHabits.length === 0 ? (
            <EmptyState
              icon="archive-outline"
              title="No archived habits"
              description="Habits you archive will appear here. You can restore them anytime without losing your historical logs."
            />
          ) : (
            archivedHabits.map((habit) => (
              <View
                key={habit.id}
                style={[
                  styles.habitCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <View
                  style={[
                    styles.iconWrap,
                    { backgroundColor: `${habit.color}18` },
                  ]}
                >
                  <Ionicons name={habit.icon as any} size={20} color={habit.color} />
                </View>

                <View style={styles.infoCol}>
                  <Text style={[styles.name, { color: theme.textMuted }]} numberOfLines={1}>
                    {habit.name}
                  </Text>
                  <Text style={[styles.scheduleText, { color: theme.textSubtle }]}>
                    Archived
                  </Text>
                </View>

                <View style={styles.actionsRow}>
                  <Pressable
                    onPress={() => {
                      triggerHaptic.success();
                      restoreHabit(habit.id);
                    }}
                    style={({ pressed }) => [
                      styles.actionBtn,
                      { backgroundColor: pressed ? theme.surfaceHighlight : 'transparent' },
                    ]}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Restore habit"
                  >
                    <Ionicons name="refresh-outline" size={18} color={theme.success} />
                  </Pressable>

                  <Pressable
                    onPress={() => confirmDelete(habit)}
                    style={({ pressed }) => [
                      styles.actionBtn,
                      { backgroundColor: pressed ? theme.surfaceHighlight : 'transparent' },
                    ]}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Delete habit permanently"
                  >
                    <Ionicons name="trash-outline" size={18} color={theme.danger} />
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* Add / Edit Sheet */}
      <HabitSheet
        visible={sheetVisible}
        habitToEdit={editingHabit}
        onClose={() => {
          setSheetVisible(false);
          setEditingHabit(null);
        }}
        onSave={(data) => {
          if (editingHabit) {
            editHabit(editingHabit.id, data);
            setEditingHabit(null);
          } else {
            addHabit(data);
          }
        }}
      />

      {/* Detail Modal */}
      <HabitDetailModal
        visible={!!detailHabit}
        habit={detailHabit}
        onClose={() => setDetailHabit(null)}
        onEdit={(habit) => {
          setEditingHabit(habit);
          setSheetVisible(true);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.title1,
    fontSize: 28,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    fontSize: 14,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.card,
    minHeight: 40,
  },
  addBtnText: {
    ...TYPOGRAPHY.headline,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: RADII.card,
    padding: 3,
    marginBottom: SPACING.md,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 38,
  },
  segmentLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADII.card,
    borderWidth: 1,
    marginVertical: 4,
    minHeight: 66,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  dragHandle: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  habitMainPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  infoCol: {
    flex: 1,
  },
  name: {
    ...TYPOGRAPHY.headline,
    fontSize: 15,
  },
  scheduleText: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: RADII.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
