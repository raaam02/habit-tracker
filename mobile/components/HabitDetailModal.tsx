import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Habit } from '../types/habit';
import { useAppTheme } from '../constants/useAppTheme';
import { useHabitStore } from '../store/habitStore';
import { computeStreakStats } from '../utils/streaks';
import { YearlyHeatmap } from './YearlyHeatmap';
import { getTodayDateString, formatHeaderDate } from '../utils/date';
import { SPACING, RADII, TYPOGRAPHY, TOUCH_TARGET } from '../constants/theme';
import { triggerHaptic } from '../services/haptics';

interface HabitDetailModalProps {
  visible: boolean;
  habit: Habit | null;
  onClose: () => void;
  onEdit: (habit: Habit) => void;
}

export const HabitDetailModal: React.FC<HabitDetailModalProps> = ({
  visible,
  habit,
  onClose,
  onEdit,
}) => {
  const { theme } = useAppTheme();
  const logs = useHabitStore((state) => state.logs);
  const logHabit = useHabitStore((state) => state.logHabit);
  const [newNote, setNewNote] = useState('');

  if (!habit) return null;

  const today = getTodayDateString();
  const stats = computeStreakStats(habit, logs, today);
  const habitLogs = logs
    .filter((l) => l.habitId === habit.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const todayLog = habitLogs.find((l) => l.date === today);

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    triggerHaptic.success();
    const currentValue = todayLog?.value || 0;
    logHabit(habit.id, today, currentValue, newNote.trim());
    setNewNote('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View
          style={[
            styles.container,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.habitHeaderRow}>
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: `${habit.color}25` },
                ]}
              >
                <Ionicons name={habit.icon as any} size={24} color={habit.color} />
              </View>
              <View style={styles.titleWrap}>
                <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                  {habit.name}
                </Text>
                <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                  {habit.type === 'check'
                    ? 'Daily Check'
                    : `${habit.target} ${habit.type === 'minutes' ? 'mins' : 'times'} / day`}
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <Pressable
                onPress={() => {
                  triggerHaptic.light();
                  onClose();
                  onEdit(habit);
                }}
                style={({ pressed }) => [
                  styles.editButton,
                  { backgroundColor: pressed ? theme.surfaceHighlight : theme.elevated },
                ]}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Edit habit"
              >
                <Ionicons name="pencil" size={18} color={theme.accent} />
              </Pressable>

              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.closeButton,
                  { backgroundColor: pressed ? theme.surfaceHighlight : theme.elevated },
                ]}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={20} color={theme.textMuted} />
              </Pressable>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* 4 Streak Stat Cards */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: theme.elevated, borderColor: theme.border }]}>
                <View style={styles.statIconRow}>
                  <Ionicons
                    name="flame"
                    size={20}
                    color={stats.isAtRisk ? theme.warning : '#F97316'}
                  />
                  {stats.isAtRisk && (
                    <Text style={[styles.riskLabel, { color: theme.warning }]}>At Risk</Text>
                  )}
                </View>
                <Text style={[styles.statValue, { color: theme.text }]}>{stats.currentStreak}</Text>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>Current Streak</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: theme.elevated, borderColor: theme.border }]}>
                <Ionicons name="trophy" size={20} color="#FBBF24" />
                <Text style={[styles.statValue, { color: theme.text }]}>{stats.bestStreak}</Text>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>Best Streak</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: theme.elevated, borderColor: theme.border }]}>
                <Ionicons name="trending-up" size={20} color={theme.accent} />
                <Text style={[styles.statValue, { color: theme.text }]}>{stats.completionRate7d}%</Text>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>7-Day Rate</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: theme.elevated, borderColor: theme.border }]}>
                <Ionicons name="calendar-outline" size={20} color={theme.success} />
                <Text style={[styles.statValue, { color: theme.text }]}>{stats.completionRate30d}%</Text>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>30-Day Rate</Text>
              </View>
            </View>

            {/* Per-habit Heatmap */}
            <YearlyHeatmap habits={[habit]} logs={logs} specificHabitId={habit.id} />

            {/* Habit Notes Section */}
            <View style={[styles.notesSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.sectionHeading, { color: theme.text }]}>Reflection & Notes</Text>

              {/* Add Note Input */}
              <View style={styles.addNoteRow}>
                <TextInput
                  style={[
                    styles.noteInput,
                    {
                      backgroundColor: theme.elevated,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  placeholder="Add a quick note for today..."
                  placeholderTextColor={theme.textSubtle}
                  value={newNote}
                  onChangeText={setNewNote}
                  maxLength={140}
                />
                <Pressable
                  onPress={handleAddNote}
                  disabled={!newNote.trim()}
                  style={({ pressed }) => [
                    styles.saveNoteBtn,
                    {
                      backgroundColor: !newNote.trim()
                        ? theme.surfaceHighlight
                        : pressed
                        ? theme.accentMuted
                        : theme.accent,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Save note"
                >
                  <Ionicons
                    name="arrow-up"
                    size={18}
                    color={!newNote.trim() ? theme.textSubtle : '#FFFFFF'}
                  />
                </Pressable>
              </View>

              {/* Logs history */}
              <View style={styles.notesList}>
                {habitLogs.filter((l) => l.note).length === 0 ? (
                  <Text style={[styles.emptyNotes, { color: theme.textSubtle }]}>
                    No notes recorded yet. Reflect on your wins and hurdles!
                  </Text>
                ) : (
                  habitLogs
                    .filter((l) => l.note)
                    .map((item) => (
                      <View
                        key={item.id}
                        style={[
                          styles.noteItem,
                          {
                            backgroundColor: theme.elevated,
                            borderColor: theme.border,
                          },
                        ]}
                      >
                        <View style={styles.noteMetaRow}>
                          <Text style={[styles.noteDate, { color: theme.textMuted }]}>
                            {formatHeaderDate(item.date)}
                          </Text>
                          <Text style={[styles.noteValue, { color: theme.accent }]}>
                            {item.value} {habit.type === 'minutes' ? 'min' : ''}
                          </Text>
                        </View>
                        <Text style={[styles.noteText, { color: theme.text }]}>{item.note}</Text>
                      </View>
                    ))
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  container: {
    width: '100%',
    maxHeight: '92%',
    maxWidth: 560,
    alignSelf: 'center',
    borderTopLeftRadius: RADII.sheet,
    borderTopRightRadius: RADII.sheet,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.base,
    paddingBottom: SPACING.xxxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  habitHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.title2,
    fontSize: 20,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingVertical: SPACING.md,
    paddingBottom: SPACING.xxxl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    minWidth: '46%',
    padding: SPACING.md,
    borderRadius: RADII.card,
    borderWidth: 1,
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  riskLabel: {
    ...TYPOGRAPHY.tiny,
    fontSize: 10,
    fontWeight: '700',
  },
  statValue: {
    ...TYPOGRAPHY.title1,
    fontSize: 26,
    marginVertical: 4,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
  },
  notesSection: {
    padding: SPACING.base,
    borderRadius: RADII.card,
    borderWidth: 1,
    marginTop: SPACING.sm,
  },
  sectionHeading: {
    ...TYPOGRAPHY.headline,
    fontSize: 16,
    marginBottom: SPACING.sm,
  },
  addNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  noteInput: {
    flex: 1,
    ...TYPOGRAPHY.body,
    fontSize: 14,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.md,
    borderWidth: 1,
    minHeight: TOUCH_TARGET,
  },
  saveNoteBtn: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notesList: {
    gap: SPACING.xs,
  },
  emptyNotes: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
    paddingVertical: SPACING.base,
  },
  noteItem: {
    padding: SPACING.md,
    borderRadius: RADII.md,
    borderWidth: 1,
  },
  noteMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  noteDate: {
    ...TYPOGRAPHY.tiny,
    fontWeight: '600',
  },
  noteValue: {
    ...TYPOGRAPHY.tiny,
    fontWeight: '700',
  },
  noteText: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
  },
});
