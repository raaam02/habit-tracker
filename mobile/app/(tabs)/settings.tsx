import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Switch,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { useAppTheme } from '../../constants/useAppTheme';
import { useHabitStore } from '../../store/habitStore';
import { ThemePreference } from '../../types/habit';
import { exportHabitData, pickAndImportData } from '../../services/backup';
import { syncHabitReminders, triggerTestNotification } from '../../services/notifications';
import { ConfirmModal } from '../../components/ConfirmModal';
import { CollapsibleHeader } from '../../components/CollapsibleHeader';
import { SettingCard, SettingRow } from '../../components/SettingCard';
import { SegmentedControl, SegmentOption } from '../../components/SegmentedControl';
import { SPACING, RADII, TYPOGRAPHY, TOUCH_TARGET } from '../../constants/theme';
import { triggerHaptic } from '../../services/haptics';

const THEME_OPTIONS: SegmentOption<ThemePreference>[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const WEEK_START_OPTIONS: SegmentOption<0 | 1>[] = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
];

export default function SettingsScreen() {
  const { theme, themePreference, setThemePreference } = useAppTheme();
  const router = useRouter();
  const habits = useHabitStore((state) => state.habits);
  const logs = useHabitStore((state) => state.logs);
  const settings = useHabitStore((state) => state.settings);
  const updateSettings = useHabitStore((state) => state.updateSettings);
  const importData = useHabitStore((state) => state.importData);
  const resetAllData = useHabitStore((state) => state.resetAllData);

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);

  const handleToggleReminders = (enabled: boolean) => {
    triggerHaptic.light();
    updateSettings({ remindersEnabled: enabled });
    syncHabitReminders(habits, enabled);
  };

  const handleTestNotification = async () => {
    triggerHaptic.medium();
    if (Platform.OS === 'web') {
      setMessage('Notifications are configured for Android & iOS native devices.');
      setTimeout(() => setMessage(null), 3500);
      return;
    }
    const sent = await triggerTestNotification();
    if (sent) {
      setMessage('Test notification sent! Check your notification shade.');
    } else {
      setMessage('Could not trigger notification. Ensure device permissions are enabled.');
    }
    setTimeout(() => setMessage(null), 3500);
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
        setMessage('Backup exported successfully');
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
          setMessage(`Successfully imported ${result.habits.length} habits`);
          setTimeout(() => setMessage(null), 3500);
        } else {
          setMessage('Import failed. Invalid habit tracker backup file.');
          setTimeout(() => setMessage(null), 3500);
        }
      }
    } finally {
      setImporting(false);
    }
  };

  const executeReset = () => {
    resetAllData();
    setShowResetModal(false);
    router.replace('/onboarding');
  };

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Native-style Collapsible iOS Large Title Header */}
      <CollapsibleHeader
        title="Settings"
        subtitle="Preferences, backup, and appearance"
        scrollY={scrollY}
      />

      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Status Toast */}
        {message && (
          <View style={[styles.toast, { backgroundColor: theme.elevated, borderColor: theme.accent }]}>
            <Ionicons name="information-circle" size={18} color={theme.accent} />
            <Text style={[styles.toastText, { color: theme.text }]}>{message}</Text>
          </View>
        )}

        {/* Appearance */}
        <SettingCard title="Appearance">
          <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Theme</Text>
          <SegmentedControl
            options={THEME_OPTIONS}
            value={themePreference}
            onChange={setThemePreference}
          />

          <SettingRow
            title="Reduce motion"
            subtitle="Replaces springs with subtle fades"
            borderTop
            rightControl={
              <Switch
                value={settings.reduceMotion}
                onValueChange={handleToggleReduceMotion}
                trackColor={{ false: theme.border, true: theme.accent }}
                thumbColor="#FFFFFF"
              />
            }
          />
        </SettingCard>

        {/* Calendar & Reminders */}
        <SettingCard title="Schedule & Reminders">
          <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>First day of week</Text>
          <SegmentedControl
            options={WEEK_START_OPTIONS}
            value={settings.weekStartDay}
            onChange={(val) => updateSettings({ weekStartDay: val })}
          />

          <SettingRow
            title="Daily reminders"
            subtitle="Scheduled notifications on device"
            borderTop
            rightControl={
              <Switch
                value={settings.remindersEnabled}
                onValueChange={handleToggleReminders}
                trackColor={{ false: theme.border, true: theme.accent }}
                thumbColor="#FFFFFF"
              />
            }
          />

          {settings.remindersEnabled && (
            <SettingRow
              title="Test reminder"
              subtitle="Trigger an immediate notification to test channel"
              borderTop
              rightControl={
                <Pressable
                  onPress={handleTestNotification}
                  style={({ pressed }) => [
                    styles.testNotifBtn,
                    { backgroundColor: pressed ? theme.surfaceHighlight : theme.accentMuted },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Send test reminder"
                >
                  <Ionicons name="notifications-outline" size={14} color={theme.accent} />
                  <Text style={[styles.testNotifBtnText, { color: theme.accent }]}>Send test</Text>
                </Pressable>
              }
            />
          )}
        </SettingCard>

        {/* Backup & Restore */}
        <SettingCard title="Backup & Data">
          <Text style={[styles.cardDesc, { color: theme.textMuted }]}>
            Local-first storage. Export JSON files to easily migrate data across devices.
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
              <Ionicons name="cloud-upload-outline" size={19} color={theme.accent} />
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
              <Ionicons name="cloud-download-outline" size={19} color={theme.success} />
              <Text style={[styles.actionCardBtnText, { color: theme.text }]}>
                {importing ? 'Importing...' : 'Import JSON'}
              </Text>
            </Pressable>
          </View>

          {/* Subtle Danger Reset Row */}
          <Pressable
            onPress={() => {
              triggerHaptic.medium();
              setShowResetModal(true);
            }}
            style={({ pressed }) => [
              styles.subtleDangerRow,
              {
                backgroundColor: pressed ? 'rgba(239, 68, 68, 0.16)' : 'rgba(239, 68, 68, 0.08)',
                borderColor: 'rgba(239, 68, 68, 0.28)',
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Reset all data"
          >
            <View style={styles.resetLeft}>
              <Ionicons name="trash-outline" size={17} color={theme.danger} />
              <Text style={[styles.subtleDangerLabel, { color: theme.danger }]}>
                Reset all habits & logs
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={15} color={theme.danger} style={{ opacity: 0.7 }} />
          </Pressable>
        </SettingCard>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSubtle }]}>
            Habit Tracker • Expo SDK 58 • Local-First • No Login
          </Text>
        </View>
      </Animated.ScrollView>

      {/* Theme-Aware Reset Confirmation Dialog */}
      <ConfirmModal
        visible={showResetModal}
        title="Reset All Data"
        message="Are you sure? This will delete all your habits, logs, and streak history from this device. You will be redirected to onboarding to start fresh."
        confirmLabel="Reset Everything"
        cancelLabel="Cancel"
        isDestructive
        onConfirm={executeReset}
        onCancel={() => setShowResetModal(false)}
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
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.sm,
    paddingBottom: 110,
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
    fontSize: 13,
    flex: 1,
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
    marginBottom: 6,
  },
  testNotifBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: RADII.pill,
  },
  testNotifBtnText: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
    fontWeight: '600',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
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
  subtleDangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.base,
    borderRadius: RADII.md,
    borderWidth: 1,
  },
  resetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  subtleDangerLabel: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    fontWeight: '600',
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
