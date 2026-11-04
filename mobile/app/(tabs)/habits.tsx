import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { useAppTheme } from '../../constants/useAppTheme';
import { useHabitStore } from '../../store/habitStore';
import { Habit } from '../../types/habit';
import { HabitSheet } from '../../components/HabitSheet';
import { HabitDetailModal } from '../../components/HabitDetailModal';
import { ConfirmModal } from '../../components/ConfirmModal';
import { CollapsibleHeader } from '../../components/CollapsibleHeader';
import { EmptyState } from '../../components/EmptyState';
import { SegmentedControl } from '../../components/SegmentedControl';
import { DraggableHabitItem } from '../../components/DraggableHabitItem';
import { ArchivedHabitCard } from '../../components/ArchivedHabitCard';
import { SPACING, RADII, TYPOGRAPHY } from '../../constants/theme';
import { triggerHaptic } from '../../services/haptics';

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

  const scrollY = useSharedValue(0);
  const activeDragIndex = useSharedValue(-1);
  const currentHoverIndex = useSharedValue(-1);
  const dragTranslationY = useSharedValue(0);
  const isPressing = useSharedValue(false);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const newHabitAction = (
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
  );

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Native-style Collapsible iOS Large Title Header */}
      <CollapsibleHeader
        title="Habits"
        subtitle={`${activeHabits.length} active • ${archivedHabits.length} archived`}
        scrollY={scrollY}
        rightAction={newHabitAction}
      />

      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        <View style={styles.container}>
          {/* Reusable Segmented Control */}
          <SegmentedControl
            options={[
              { value: 'active', label: 'Active', badge: activeHabits.length },
              { value: 'archived', label: 'Archived', badge: archivedHabits.length },
            ]}
            value={activeTab}
            onChange={(val) => setActiveTab(val as 'active' | 'archived')}
            style={styles.segmentWrap}
          />

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
                    activeDragIndex={activeDragIndex}
                    currentHoverIndex={currentHoverIndex}
                    dragTranslationY={dragTranslationY}
                    isPressing={isPressing}
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
                  <ArchivedHabitCard
                    key={habit.id}
                    habit={habit}
                    onRestore={() => {
                      triggerHaptic.success();
                      restoreHabit(habit.id);
                    }}
                    onDelete={() => {
                      triggerHaptic.heavy();
                      setHabitToDelete(habit);
                    }}
                  />
                ))
              )}
            </>
          )}
        </View>
      </Animated.ScrollView>

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

      {/* Detail Modal */}
      {detailHabit && (
        <HabitDetailModal
          visible={!!detailHabit}
          habit={detailHabit}
          onClose={() => setDetailHabit(null)}
          onEdit={(h) => {
            setDetailHabit(null);
            setEditingHabit(h);
            setSheetVisible(true);
          }}
        />
      )}

      {/* Permanent Deletion Confirmation Modal */}
      <ConfirmModal
        visible={!!habitToDelete}
        title="Delete Habit Permanently?"
        message={`Are you sure you want to delete "${habitToDelete?.name}"? All associated completion history and records will be permanently removed.`}
        confirmLabel="Delete Forever"
        cancelLabel="Keep Habit"
        isDestructive
        onConfirm={() => {
          if (habitToDelete) {
            deleteHabit(habitToDelete.id);
            setHabitToDelete(null);
          }
        }}
        onCancel={() => setHabitToDelete(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  container: {
    paddingHorizontal: SPACING.base,
  },
  segmentWrap: {
    marginBottom: SPACING.md,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADII.sm,
  },
  addBtnText: {
    ...TYPOGRAPHY.caption,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
