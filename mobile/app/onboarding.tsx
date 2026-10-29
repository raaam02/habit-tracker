import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../constants/useAppTheme';
import { useHabitStore } from '../store/habitStore';
import { STARTER_TEMPLATES } from '../constants/templates';
import { SPACING, RADII, TYPOGRAPHY, TOUCH_TARGET } from '../constants/theme';
import { triggerHaptic } from '../services/haptics';

export default function OnboardingScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const preloadTemplates = useHabitStore((state) => state.preloadTemplates);
  const updateSettings = useHabitStore((state) => state.updateSettings);

  // By default, select all starter templates
  const [selectedIds, setSelectedIds] = useState<string[]>(
    STARTER_TEMPLATES.map((t) => t.templateId)
  );

  const toggleTemplate = (id: string) => {
    triggerHaptic.selection();
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleStartWithSelected = () => {
    triggerHaptic.success();
    preloadTemplates(selectedIds);
    router.replace('/(tabs)');
  };

  const handleStartEmpty = () => {
    triggerHaptic.light();
    updateSettings({ hasCompletedOnboarding: true });
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.badge, { backgroundColor: theme.accentMuted }]}>
            <Ionicons name="sparkles" size={14} color={theme.accent} />
            <Text style={[styles.badgeText, { color: theme.accent }]}>Local-First Habit Tracker</Text>
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Build Daily Habits</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Pick from curated starter habits or begin with a clean slate. Every template is fully customizable.
          </Text>
        </View>

        {/* Templates List */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {STARTER_TEMPLATES.map((tpl) => {
            const isSelected = selectedIds.includes(tpl.templateId);
            return (
              <Pressable
                key={tpl.templateId}
                onPress={() => toggleTemplate(tpl.templateId)}
                style={({ pressed }) => [
                  styles.templateCard,
                  {
                    backgroundColor: isSelected ? theme.elevated : theme.surface,
                    borderColor: isSelected ? tpl.color : theme.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={`${tpl.name}`}
              >
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: `${tpl.color}25` },
                  ]}
                >
                  <Ionicons name={tpl.icon as any} size={22} color={tpl.color} />
                </View>

                <View style={styles.cardContent}>
                  <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
                    {tpl.name}
                  </Text>
                  <Text style={[styles.cardMeta, { color: theme.textMuted }]}>
                    {tpl.type === 'check'
                      ? 'Daily Check'
                      : tpl.type === 'count'
                      ? `${tpl.target} reps`
                      : `${tpl.target} mins`}{' '}
                    •{' '}
                    {tpl.scheduledDays.length === 7
                      ? 'Every day'
                      : tpl.scheduledDays.length === 1 && tpl.scheduledDays[0] === 0
                      ? 'Sundays only'
                      : `${tpl.scheduledDays.length} days/week`}
                  </Text>
                </View>

                {/* Checkbox circle */}
                <View
                  style={[
                    styles.checkCircle,
                    {
                      backgroundColor: isSelected ? tpl.color : 'transparent',
                      borderColor: isSelected ? tpl.color : theme.borderLight,
                    },
                  ]}
                >
                  {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Bottom Actions */}
        <View style={[styles.bottomBar, { backgroundColor: theme.background }]}>
          <Pressable
            onPress={handleStartWithSelected}
            style={({ pressed }) => [
              styles.primaryBtn,
              {
                backgroundColor: pressed ? theme.accentMuted : theme.accent,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Continue with selected habits"
          >
            <Text style={styles.primaryBtnText}>
              {selectedIds.length > 0
                ? `Get Started (${selectedIds.length} habits)`
                : 'Get Started'}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleStartEmpty}
            style={styles.secondaryBtn}
            accessibilityRole="button"
            accessibilityLabel="Start empty with no habits"
          >
            <Text style={[styles.secondaryBtnText, { color: theme.textMuted }]}>
              Start with an empty tracker
            </Text>
          </Pressable>
        </View>
      </View>
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
    paddingTop: Platform.OS === 'android' ? SPACING.xl : SPACING.base,
  },
  header: {
    marginBottom: SPACING.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADII.sm,
    marginBottom: SPACING.sm,
  },
  badgeText: {
    ...TYPOGRAPHY.tiny,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    ...TYPOGRAPHY.title1,
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    lineHeight: 20,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
    borderRadius: RADII.card,
    borderWidth: 1.5,
    minHeight: 70,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    ...TYPOGRAPHY.headline,
    fontSize: 16,
  },
  cardMeta: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
    marginTop: 2,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
  bottomBar: {
    paddingVertical: SPACING.base,
    gap: SPACING.xs,
  },
  primaryBtn: {
    paddingVertical: SPACING.base,
    borderRadius: RADII.card,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TOUCH_TARGET,
  },
  primaryBtnText: {
    ...TYPOGRAPHY.headline,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryBtn: {
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  secondaryBtnText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
  },
});
