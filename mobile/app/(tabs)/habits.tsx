import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  LinearTransition,
} from 'react-native-reanimated';
import { useAppTheme } from '../../constants/useAppTheme';
import { useHabitStore } from '../../store/habitStore';
import { Habit } from '../../types/habit';
import { HabitSheet } from '../../components/HabitSheet';
import { HabitDetailModal } from '../../components/HabitDetailModal';
import { ConfirmModal } from '../../components/ConfirmModal';
import { EmptyState } from '../../components/EmptyState';
import { SPACING, RADII, TYPOGRAPHY } from '../../constants/theme';
import { triggerHaptic } from '../../services/haptics';

const ROW_HEIGHT = 68;

interface DraggableHabitItemProps {
  habit: Habit;
  index: number;
  total: number;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onPress: () => void;
  onEdit: () => void;
  onArchive: () => void;
}

const DraggableHabitItem: React.FC<DraggableHabitItemProps> = ({
  habit,
  index,
  total,
  onReorder,
  onPress,
  onEdit,
  onArchive,
}) => {
  const { theme } = useAppTheme();
  const translateY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  // Direct 1:1 drag gesture without rubber-band oscillation
  const dragGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      isDragging.value = true;
      runOnJS(triggerHaptic.medium)();
    })
    .onUpdate((event) => {
      'worklet';
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      'worklet';
      isDragging.value = false;
      const moveCount = Math.round(event.translationY / ROW_HEIGHT);
      const targetIndex = Math.max(0, Math.min(total - 1, index + moveCount));

      // Settle directly into target position with clean critically-damped timing
      translateY.value = withTiming(0, { duration: 160 }, () => {
        if (targetIndex !== index) {
          runOnJS(onReorder)(index, targetIndex);
        }
      });
      runOnJS(triggerHaptic.light)();
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: isDragging.value ? withTiming(1.025, { duration: 120 }) : withTiming(1, { duration: 140 }) },
    ],
    zIndex: isDragging.value ? 99 : 1,
    elevation: isDragging.value ? 10 : 0,
    shadowColor: '#000000',
    shadowOpacity: isDragging.value ? 0.3 : 0,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  }));

  return (
    <Animated.View
      layout={LinearTransition.springify().damping(24).stiffness(240)}
      style={[
        styles.habitCard,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
        animatedStyle,
      ]}
    >
      {/* Drag Handle with Direct Manipulation */}
      <GestureDetector gesture={dragGesture}>
        <View style={styles.dragHandle} hitSlop={12} accessibilityRole="button" accessibilityLabel="Drag to reorder">
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

      {/* Action buttons */}
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
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);

  const activeHabits = habits
    .filter((h) => !h.archivedAt)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const archivedHabits = habits
    .filter((h) => !!h.archivedAt)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const updated = [...activeHabits];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    const reordered = updated.map((item, idx) => ({ ...item, sortOrder: idx }));
    reorderHabits(reordered);
  };

  const handleCreateOrEdit = (
    data: Omit<Habit, 'id' | 'createdAt' | 'sortOrder'>
  ) => {
    if (editingHabit) {
      editHabit(editingHabit.id, data);
      setEditingHabit(null);
    } else {
      addHabit(data);
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

        {/* Tab switch */}
        <View style={[styles.tabBar, { backgroundColor: theme.elevated }]}>
          <Pressable
            onPress={() => {
              triggerHaptic.selection();
              setActiveTab('active');
            }}
            style={[
              styles.tabBtn,
              {
                backgroundColor: activeTab === 'active' ? theme.accent : 'transparent',
              },
            ]}
          >
            <Text
              style={[
                styles.tabBtnText,
                {
                  color: activeTab === 'active' ? '#FFFFFF' : theme.textMuted,
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
              styles.tabBtn,
              {
                backgroundColor: activeTab === 'archived' ? theme.accent : 'transparent',
              },
            ]}
          >
            <Text
              style={[
                styles.tabBtnText,
                {
                  color: activeTab === 'archived' ? '#FFFFFF' : theme.textMuted,
                  fontWeight: activeTab === 'archived' ? '700' : '500',
                },
              ]}
            >
              Archived ({archivedHabits.length})
            </Text>
          </Pressable>
        </View>

        {/* List */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'active' && (
            <>
              {activeHabits.length === 0 ? (
                <EmptyState
                  icon="list-outline"
                  title="No active habits"
                  description="Add your first ritual to start building lasting streaks."
                  actionLabel="Add habit"
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
                    onReorder={handleReorder}
                    onPress={() => setDetailHabit(habit)}
                    onEdit={() => {
                      setEditingHabit(habit);
                      setSheetVisible(true);
                    }}
                    onArchive={() => {
                      triggerHaptic.light();
                      archiveHabit(habit.id);
                    }}
                  />
                ))
              )}
            </>
          )}

          {activeTab === 'archived' && (
            <>
              {archivedHabits.length === 0 ? (
                <EmptyState
                  icon="archive-outline"
                  title="No archived habits"
                  description="When you archive a habit, it rests here without affecting active streaks."
                />
              ) : (
                archivedHabits.map((habit) => (
                  <View
                    key={habit.id}
                    style={[
                      styles.archivedCard,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <View style={styles.archivedInfo}>
                      <View style={[styles.iconWrap, { backgroundColor: `${habit.color}15` }]}>
                        <Ionicons name={habit.icon as any} size={20} color={habit.color} />
                      </View>
                      <View style={styles.infoCol}>
                        <Text style={[styles.name, { color: theme.textMuted }]} numberOfLines={1}>
                          {habit.name}
                        </Text>
                        <Text style={[styles.scheduleText, { color: theme.textSubtle }]}>
                          Archived • Tap restore to bring back
                        </Text>
                      </View>
                    </View>

                    <View style={styles.archivedActions}>
                      <Pressable
                        onPress={() => {
                          triggerHaptic.success();
                          restoreHabit(habit.id);
                        }}
                        style={[styles.restoreBtn, { backgroundColor: theme.accentMuted }]}
                        hitSlop={6}
                        accessibilityRole="button"
                        accessibilityLabel="Restore habit"
                      >
                        <Ionicons name="refresh" size={15} color={theme.accent} />
                        <Text style={[styles.restoreBtnText, { color: theme.accent }]}>Restore</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => {
                          triggerHaptic.heavy();
                          setHabitToDelete(habit);
                        }}
                        style={[styles.deleteBtn, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}
                        hitSlop={6}
                        accessibilityRole="button"
                        accessibilityLabel="Delete habit permanently"
                      >
                        <Ionicons name="trash-outline" size={15} color={theme.danger} />
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </>
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
        onSave={handleCreateOrEdit}
      />

      {/* Habit Detail Modal */}
      <HabitDetailModal
        visible={!!detailHabit}
        habit={detailHabit}
        onClose={() => setDetailHabit(null)}
        onEdit={(habit) => {
          setEditingHabit(habit);
          setSheetVisible(true);
        }}
      />

      {/* Theme-Aware Delete Confirmation Modal */}
      <ConfirmModal
        visible={!!habitToDelete}
        title="Delete Habit"
        message={`Are you sure you want to permanently delete "${habitToDelete?.name}"? All logged progress will be erased.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive
        onConfirm={() => {
          if (habitToDelete) {
            deleteHabit(habitToDelete.id);
            setHabitToDelete(null);
          }
        }}
        onCancel={() => setHabitToDelete(null)}
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
    fontSize: 13,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADII.pill,
  },
  addBtnText: {
    ...TYPOGRAPHY.headline,
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: RADII.card,
    padding: 3,
    marginBottom: SPACING.md,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  tabBtnText: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADII.card,
    borderWidth: 1,
    marginBottom: SPACING.sm,
    minHeight: ROW_HEIGHT,
  },
  dragHandle: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitMainPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 2,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
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
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  archivedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.base,
    borderRadius: RADII.card,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  archivedInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  archivedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADII.pill,
  },
  restoreBtnText: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    fontWeight: '600',
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
