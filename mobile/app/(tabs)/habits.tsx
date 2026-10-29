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
import { useAppTheme } from '../../constants/useAppTheme';
import { useHabitStore } from '../../store/habitStore';
import { Habit } from '../../types/habit';
import { HabitSheet } from '../../components/HabitSheet';
import { HabitDetailModal } from '../../components/HabitDetailModal';
import { EmptyState } from '../../components/EmptyState';
import { SPACING, RADII, TYPOGRAPHY, TOUCH_TARGET } from '../../constants/theme';
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

  const activeHabits = habits
    .filter((h) => !h.archivedAt)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const archivedHabits = habits
    .filter((h) => !!h.archivedAt)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    triggerHaptic.selection();
    const updated = [...activeHabits];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    reorderHabits(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === activeHabits.length - 1) return;
    triggerHaptic.selection();
    const updated = [...activeHabits];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
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
            <Text style={[styles.title, { color: theme.text }]}>Manage Habits</Text>
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
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Add</Text>
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
                title="No Active Habits"
                description="Get started by creating a new habit or exploring starter templates."
                actionLabel="Create Habit"
                onAction={() => {
                  setEditingHabit(null);
                  setSheetVisible(true);
                }}
              />
            ) : (
              activeHabits.map((habit, index) => (
                <View
                  key={habit.id}
                  style={[
                    styles.habitCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  {/* Reorder Arrows */}
                  <View style={styles.reorderColumn}>
                    <Pressable
                      onPress={() => handleMoveUp(index)}
                      disabled={index === 0}
                      style={styles.reorderBtn}
                      hitSlop={6}
                      accessibilityRole="button"
                      accessibilityLabel="Move habit up"
                    >
                      <Ionicons
                        name="chevron-up"
                        size={16}
                        color={index === 0 ? theme.borderLight : theme.textMuted}
                      />
                    </Pressable>
                    <Pressable
                      onPress={() => handleMoveDown(index)}
                      disabled={index === activeHabits.length - 1}
                      style={styles.reorderBtn}
                      hitSlop={6}
                      accessibilityRole="button"
                      accessibilityLabel="Move habit down"
                    >
                      <Ionicons
                        name="chevron-down"
                        size={16}
                        color={
                          index === activeHabits.length - 1
                            ? theme.borderLight
                            : theme.textMuted
                        }
                      />
                    </Pressable>
                  </View>

                  {/* Habit info */}
                  <Pressable
                    onPress={() => {
                      triggerHaptic.light();
                      setDetailHabit(habit);
                    }}
                    style={styles.habitMainPressable}
                    accessibilityRole="button"
                    accessibilityLabel={`View ${habit.name}`}
                  >
                    <View
                      style={[
                        styles.iconWrap,
                        { backgroundColor: `${habit.color}25` },
                      ]}
                    >
                      <Ionicons
                        name={habit.icon as any}
                        size={20}
                        color={habit.color}
                      />
                    </View>

                    <View style={styles.infoCol}>
                      <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                        {habit.name}
                      </Text>
                      <Text style={[styles.scheduleText, { color: theme.textMuted }]}>
                        {habit.scheduledDays.length === 7
                          ? 'Every day'
                          : `${habit.scheduledDays.length} days / week`}{' '}
                        • {habit.type === 'check' ? 'Yes/No' : `${habit.target} target`}
                      </Text>
                    </View>
                  </Pressable>

                  {/* Action buttons */}
                  <View style={styles.actionsRow}>
                    <Pressable
                      onPress={() => {
                        triggerHaptic.light();
                        setEditingHabit(habit);
                        setSheetVisible(true);
                      }}
                      style={({ pressed }) => [
                        styles.actionBtn,
                        { backgroundColor: pressed ? theme.surfaceHighlight : 'transparent' },
                      ]}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="Edit habit"
                    >
                      <Ionicons name="pencil" size={18} color={theme.accent} />
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        triggerHaptic.light();
                        archiveHabit(habit.id);
                      }}
                      style={({ pressed }) => [
                        styles.actionBtn,
                        { backgroundColor: pressed ? theme.surfaceHighlight : 'transparent' },
                      ]}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="Archive habit"
                    >
                      <Ionicons name="archive-outline" size={18} color={theme.textMuted} />
                    </Pressable>
                  </View>
                </View>
              ))
            )
          ) : archivedHabits.length === 0 ? (
            <EmptyState
              icon="archive-outline"
              title="No Archived Habits"
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
                    { backgroundColor: `${habit.color}25` },
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
    paddingTop: Platform.OS === 'android' ? SPACING.xl : SPACING.sm,
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
    paddingHorizontal: SPACING.md,
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
    paddingBottom: 90,
  },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADII.card,
    borderWidth: 1,
    marginVertical: 4,
    minHeight: 64,
  },
  reorderColumn: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  reorderBtn: {
    padding: 2,
  },
  habitMainPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
    gap: SPACING.xs,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
