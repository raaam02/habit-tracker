import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  StyleSheet,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../constants/useAppTheme';
import { useHabitStore } from '../../store/habitStore';
import { ThemePreference } from '../../types/habit';
import { exportHabitData, pickAndImportData } from '../../services/backup';
import { syncHabitReminders } from '../../services/notifications';
import { SPACING, RADII, TYPOGRAPHY, TOUCH_TARGET } from '../../constants/theme';
import { triggerHaptic } from '../../services/haptics';

export default function SettingsScreen() {
  const { theme, themePreference, setThemePreference } = useAppTheme();
  const habits = useHabitStore((state) => state.habits);
  const logs = useHabitStore((state) => state.logs);
  const settings = useHabitStore((state) => state.settings);
  const updateSettings = useHabitStore((state) => state.updateSettings);
  const importData = useHabitStore((state) => state.importData);
  const resetAllData = useHabitStore((state) => state.resetAllData);

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleToggleReminders = (enabled: boolean) => {
    triggerHaptic.light();
    updateSettings({ remindersEnabled: enabled });
    syncHabitReminders(habits, enabled);
  };

  const handleToggleReduceMotion = (enabled: boolean) => {
    triggerHaptic.light();
    updateSettings({ reduceMotion: enabled });
  };

  const handleExport = async () => {
    triggerHaptic.medium();
    setExporting(true);
    try {
      const ok = await exportHabitData({ habits, logs, settings });
      if (ok) {
        setMessage('Backup exported successfully!');
        setTimeout(() => setMessage(null), 3000);
      }
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    triggerHaptic.medium();
    setImporting(true);
    try {
      const result = await pickAndImportData();
      if (result) {
        const ok = importData(result);
        if (ok) {
          triggerHaptic.success();
          setMessage(`Successfully imported ${result.habits.length} habits!`);
          setTimeout(() => setMessage(null), 3500);
        } else {
          Alert.alert('Import Failed', 'The selected file is not a valid habit tracker backup.');
        }
      }
    } finally {
      setImporting(false);
    }
  };

  const confirmReset = () => {
    triggerHaptic.heavy();
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        'Warning: This will delete ALL your habits and logged history permanently. Proceed?'
      );
      if (confirmed) {
        resetAllData();
        setMessage('All data was reset.');
        setTimeout(() => setMessage(null), 3000);
      }
    } else {
      Alert.alert(
        'Reset All Data',
        'Are you sure? This will permanently delete all your habits, logs, and streaks. This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Reset Everything',
            style: 'destructive',
            onPress: () => {
              resetAllData();
              setMessage('All data was reset.');
              setTimeout(() => setMessage(null), 3000);
            },
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Preferences, backup, and appearance.
          </Text>
        </View>

        {/* Status Toast */}
        {message && (
          <View style={[styles.toast, { backgroundColor: theme.elevated, borderColor: theme.success }]}>
            <Ionicons name="checkmark-circle" size={18} color={theme.success} />
            <Text style={[styles.toastText, { color: theme.text }]}>{message}</Text>
          </View>
        )}

        {/* Section 1: Appearance */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Appearance</Text>

          <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Theme</Text>
          <View style={[styles.segment, { backgroundColor: theme.elevated }]}>
            {(['system', 'light', 'dark'] as ThemePreference[]).map((pref) => {
              const isSelected = themePreference === pref;
              return (
                <Pressable
                  key={pref}
                  onPress={() => {
                    triggerHaptic.selection();
                    setThemePreference(pref);
                  }}
                  style={[
                    styles.segmentBtn,
                    { backgroundColor: isSelected ? theme.accent : 'transparent' },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${pref} theme`}
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
                    {pref === 'system' ? 'System' : pref === 'light' ? 'Light' : 'Dark'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.row, { borderTopWidth: 1, borderTopColor: theme.border, marginTop: SPACING.base, paddingTop: SPACING.md }]}>
            <View style={styles.rowLabelWrap}>
              <Text style={[styles.rowTitle, { color: theme.text }]}>Reduce Motion</Text>
              <Text style={[styles.rowSub, { color: theme.textMuted }]}>
                Replaces spring animations with fast fades
              </Text>
            </View>
            <Switch
              value={settings.reduceMotion}
              onValueChange={handleToggleReduceMotion}
              trackColor={{ false: theme.border, true: theme.accent }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Section 2: General & Schedule */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Calendar & Reminders</Text>

          <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>First Day of Week</Text>
          <View style={[styles.segment, { backgroundColor: theme.elevated }]}>
            {[
              { val: 0, label: 'Sunday' },
              { val: 1, label: 'Monday' },
            ].map((opt) => {
              const isSelected = settings.weekStartDay === opt.val;
              return (
                <Pressable
                  key={opt.val}
                  onPress={() => {
                    triggerHaptic.selection();
                    updateSettings({ weekStartDay: opt.val as 0 | 1 });
                  }}
                  style={[
                    styles.segmentBtn,
                    { backgroundColor: isSelected ? theme.accent : 'transparent' },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Start week on ${opt.label}`}
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
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.row, { borderTopWidth: 1, borderTopColor: theme.border, marginTop: SPACING.base, paddingTop: SPACING.md }]}>
            <View style={styles.rowLabelWrap}>
              <Text style={[styles.rowTitle, { color: theme.text }]}>Daily Reminders</Text>
              <Text style={[styles.rowSub, { color: theme.textMuted }]}>
                Send scheduled notifications on Android/iOS
              </Text>
            </View>
            <Switch
              value={settings.remindersEnabled}
              onValueChange={handleToggleReminders}
              trackColor={{ false: theme.border, true: theme.accent }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Section 3: Data Management */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Backup & Restore</Text>
          <Text style={[styles.cardDesc, { color: theme.textMuted }]}>
            Your data is local-first and never leaves this device. Export JSON backups to transfer between devices.
          </Text>

          <View style={styles.buttonsRow}>
            <Pressable
              onPress={handleExport}
              disabled={exporting}
              style={({ pressed }) => [
                styles.actionCardBtn,
                {
                  backgroundColor: pressed ? theme.surfaceHighlight : theme.elevated,
                  borderColor: theme.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Export JSON backup"
            >
              <Ionicons name="cloud-upload-outline" size={20} color={theme.accent} />
              <Text style={[styles.actionCardBtnText, { color: theme.text }]}>
                {exporting ? 'Exporting...' : 'Export JSON'}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleImport}
              disabled={importing}
              style={({ pressed }) => [
                styles.actionCardBtn,
                {
                  backgroundColor: pressed ? theme.surfaceHighlight : theme.elevated,
                  borderColor: theme.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Import JSON backup"
            >
              <Ionicons name="cloud-download-outline" size={20} color={theme.success} />
              <Text style={[styles.actionCardBtnText, { color: theme.text }]}>
                {importing ? 'Importing...' : 'Import JSON'}
              </Text>
            </Pressable>
          </View>

          {/* Reset All Data */}
          <Pressable
            onPress={confirmReset}
            style={({ pressed }) => [
              styles.resetBtn,
              {
                backgroundColor: pressed ? `${theme.danger}20` : 'transparent',
                borderColor: theme.danger,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Reset all data"
          >
            <Ionicons name="trash" size={18} color={theme.danger} />
            <Text style={[styles.resetBtnText, { color: theme.danger }]}>
              Reset All Habits & Logs
            </Text>
          </Pressable>
        </View>

        {/* App Info Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSubtle }]}>
            Habit Tracker • Expo SDK 58 • Local-First • No Login Required
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: SPACING.base,
    paddingTop: Platform.OS === 'android' ? SPACING.xl : SPACING.sm,
    paddingBottom: 90,
  },
  header: {
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
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    padding: SPACING.md,
    borderRadius: RADII.card,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  toastText: {
    ...TYPOGRAPHY.headline,
    fontSize: 14,
  },
  card: {
    padding: SPACING.base,
    borderRadius: RADII.card,
    borderWidth: 1,
    marginBottom: SPACING.base,
  },
  cardTitle: {
    ...TYPOGRAPHY.headline,
    fontSize: 17,
    marginBottom: SPACING.sm,
  },
  cardDesc: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  segment: {
    flexDirection: 'row',
    borderRadius: RADII.card,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 38,
  },
  segmentText: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabelWrap: {
    flex: 1,
    marginRight: SPACING.base,
  },
  rowTitle: {
    ...TYPOGRAPHY.headline,
    fontSize: 15,
  },
  rowSub: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    marginTop: 2,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.base,
  },
  actionCardBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    borderRadius: RADII.card,
    borderWidth: 1,
    minHeight: TOUCH_TARGET,
  },
  actionCardBtnText: {
    ...TYPOGRAPHY.headline,
    fontSize: 14,
    fontWeight: '600',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    borderRadius: RADII.card,
    borderWidth: 1,
    minHeight: TOUCH_TARGET,
  },
  resetBtnText: {
    ...TYPOGRAPHY.headline,
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  footerText: {
    ...TYPOGRAPHY.tiny,
    fontSize: 11,
    textAlign: 'center',
  },
});
