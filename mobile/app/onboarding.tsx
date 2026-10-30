import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  LinearTransition,
} from 'react-native-reanimated';
import { useAppTheme } from '../constants/useAppTheme';
import { useHabitStore } from '../store/habitStore';
import { STARTER_TEMPLATES } from '../constants/templates';
import { SPACING, RADII, TYPOGRAPHY, TOUCH_TARGET } from '../constants/theme';
import { triggerHaptic } from '../services/haptics';

interface FocusArea {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  templateIds: string[];
}

const FOCUS_AREAS: FocusArea[] = [
  {
    id: 'focus',
    title: 'Study & Deep Work',
    subtitle: 'Daily DSA problems, technical reading, and study sessions',
    icon: 'code-slash',
    color: '#3B82F6',
    templateIds: ['dsa', 'study', 'commit'],
  },
  {
    id: 'health',
    title: 'Fitness & Physical Health',
    subtitle: 'Regular gym training, movement, and bodily recovery',
    icon: 'barbell',
    color: '#10B981',
    templateIds: ['gym', 'sleep'],
  },
  {
    id: 'routine',
    title: 'Mindful Daily Routine',
    subtitle: 'Consistent sleep, weekly reviews, and clear reflections',
    icon: 'moon',
    color: '#6366F1',
    templateIds: ['sleep', 'review'],
  },
  {
    id: 'all',
    title: 'Balanced Life Mix',
    subtitle: 'A versatile blend across coding, fitness, and sleep',
    icon: 'sparkles',
    color: '#F59E0B',
    templateIds: ['dsa', 'study', 'gym', 'commit', 'sleep', 'review'],
  },
];

export default function OnboardingScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const preloadTemplates = useHabitStore((state) => state.preloadTemplates);
  const updateSettings = useHabitStore((state) => state.updateSettings);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState('');
  const [selectedFocusIds, setSelectedFocusIds] = useState<string[]>(['focus', 'health']);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([
    'dsa',
    'study',
    'gym',
    'commit',
    'sleep',
  ]);

  const handleStep1Next = () => {
    triggerHaptic.selection();
    setStep(2);
  };

  const handleToggleFocus = (focus: FocusArea) => {
    triggerHaptic.selection();
    let nextFocusIds: string[];
    if (selectedFocusIds.includes(focus.id)) {
      if (selectedFocusIds.length > 1) {
        nextFocusIds = selectedFocusIds.filter((id) => id !== focus.id);
      } else {
        nextFocusIds = selectedFocusIds;
      }
    } else {
      nextFocusIds = [...selectedFocusIds, focus.id];
    }
    setSelectedFocusIds(nextFocusIds);

    // Aggregate all unique template IDs from selected focus areas
    const aggregated = Array.from(
      new Set(
        FOCUS_AREAS.filter((f) => nextFocusIds.includes(f.id)).flatMap((f) => f.templateIds)
      )
    );
    setSelectedTemplateIds(aggregated);
  };

  const toggleTemplate = (templateId: string) => {
    triggerHaptic.selection();
    if (selectedTemplateIds.includes(templateId)) {
      setSelectedTemplateIds(selectedTemplateIds.filter((id) => id !== templateId));
    } else {
      setSelectedTemplateIds([...selectedTemplateIds, templateId]);
    }
  };

  const handleFinishOnboarding = () => {
    triggerHaptic.success();
    updateSettings({
      userName: name.trim() || undefined,
      hasCompletedOnboarding: true,
    });
    preloadTemplates(selectedTemplateIds);
    router.replace('/(tabs)');
  };

  const handleStartEmpty = () => {
    triggerHaptic.light();
    updateSettings({
      userName: name.trim() || undefined,
      hasCompletedOnboarding: true,
    });
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <View style={styles.container}>
          {/* Progress Indicator */}
          <View style={styles.progressRow}>
            {[1, 2, 3].map((s) => (
              <View
                key={s}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor: s === step ? theme.accent : theme.surfaceHighlight,
                    width: s === step ? 28 : 8,
                  },
                ]}
              />
            ))}
          </View>

          {/* STEP 1: Name Input (Mobbin-style warm welcome) */}
          {step === 1 && (
            <Animated.View
              entering={FadeIn.duration(250)}
              exiting={FadeOut.duration(150)}
              style={styles.stepContainer}
            >
              <View style={styles.badgeWrap}>
                <View style={[styles.badge, { backgroundColor: theme.surfaceHighlight }]}>
                  <Text style={[styles.badgeText, { color: theme.textMuted }]}>
                    Personal habit tracker
                  </Text>
                </View>
              </View>

              <Text style={[styles.title, { color: theme.text }]}>What should we call you?</Text>
              <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                We personalize your dashboard and reminders. Everything stays private on this device.
              </Text>

              <View style={styles.inputWrap}>
                <TextInput
                  style={[
                    styles.nameInput,
                    {
                      color: theme.text,
                      backgroundColor: theme.surface,
                      borderColor: name.trim() ? theme.accent : theme.border,
                    },
                  ]}
                  placeholder="Your first name"
                  placeholderTextColor={theme.textSubtle}
                  value={name}
                  onChangeText={setName}
                  autoFocus
                  maxLength={30}
                  returnKeyType="next"
                  onSubmitEditing={handleStep1Next}
                />
              </View>

              <View style={styles.footerSpacing} />

              <Pressable
                onPress={handleStep1Next}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  { backgroundColor: pressed ? theme.accentMuted : theme.accent },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Continue to focus areas"
              >
                <Text style={styles.primaryBtnText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </Pressable>
            </Animated.View>
          )}

          {/* STEP 2: Choose Primary Focus */}
          {step === 2 && (
            <Animated.View
              entering={SlideInRight.duration(250)}
              exiting={SlideOutLeft.duration(150)}
              style={styles.stepContainer}
            >
              <Text style={[styles.title, { color: theme.text }]}>
                {name.trim() ? `Welcome, ${name.trim()}.` : 'Welcome.'}
              </Text>
              <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                Select your areas of focus to personalize starter habits:
              </Text>

              <View style={styles.focusList}>
                {FOCUS_AREAS.map((item) => {
                  const isSelected = selectedFocusIds.includes(item.id);
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => handleToggleFocus(item)}
                      style={({ pressed }) => [
                        styles.focusCard,
                        {
                          backgroundColor: isSelected ? theme.elevated : theme.surface,
                          borderColor: isSelected ? item.color : theme.border,
                          transform: [{ scale: pressed ? 0.985 : 1 }],
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={item.title}
                    >
                      <View
                        style={[
                          styles.focusIconWrap,
                          { backgroundColor: `${item.color}18` },
                        ]}
                      >
                        <Ionicons name={item.icon as any} size={22} color={item.color} />
                      </View>
                      <View style={styles.focusTextWrap}>
                        <Text style={[styles.focusTitle, { color: theme.text }]}>
                          {item.title}
                        </Text>
                        <Text style={[styles.focusSubtitle, { color: theme.textMuted }]}>
                          {item.subtitle}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.focusCheck,
                          {
                            backgroundColor: isSelected ? item.color : 'transparent',
                            borderColor: isSelected ? item.color : theme.borderLight,
                          },
                        ]}
                      >
                        {isSelected && <Ionicons name="checkmark" size={15} color="#FFFFFF" />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                onPress={() => {
                  triggerHaptic.selection();
                  setStep(3);
                }}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  { backgroundColor: pressed ? theme.accentMuted : theme.accent },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Continue to starter habits"
              >
                <Text style={styles.primaryBtnText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </Pressable>
            </Animated.View>
          )}

          {/* STEP 3: Starter Habits Selection */}
          {step === 3 && (
            <Animated.View
              entering={SlideInRight.duration(250)}
              exiting={SlideOutLeft.duration(150)}
              style={styles.stepContainer}
            >
              <Text style={[styles.title, { color: theme.text }]}>Your starter ritual</Text>
              <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                Select the habits you would like to track. You can edit or archive these at any time.
              </Text>

              <ScrollView
                style={styles.templateScroll}
                contentContainerStyle={styles.templateScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {STARTER_TEMPLATES.map((tpl) => {
                  const isChecked = selectedTemplateIds.includes(tpl.templateId);
                  return (
                    <Pressable
                      key={tpl.templateId}
                      onPress={() => toggleTemplate(tpl.templateId)}
                      style={({ pressed }) => [
                        styles.templateRow,
                        {
                          backgroundColor: isChecked ? theme.elevated : theme.surface,
                          borderColor: isChecked ? tpl.color : theme.border,
                          transform: [{ scale: pressed ? 0.985 : 1 }],
                        },
                      ]}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isChecked }}
                      accessibilityLabel={tpl.name}
                    >
                      <View
                        style={[
                          styles.templateIconWrap,
                          { backgroundColor: `${tpl.color}18` },
                        ]}
                      >
                        <Ionicons name={tpl.icon as any} size={20} color={tpl.color} />
                      </View>

                      <View style={styles.templateTextWrap}>
                        <Text style={[styles.templateName, { color: theme.text }]} numberOfLines={1}>
                          {tpl.name}
                        </Text>
                        <Text style={[styles.templateMeta, { color: theme.textMuted }]}>
                          {tpl.type === 'check'
                            ? 'Daily check'
                            : tpl.type === 'count'
                            ? `${tpl.target} times`
                            : `${tpl.target} mins`}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.templateCheck,
                          {
                            backgroundColor: isChecked ? tpl.color : 'transparent',
                            borderColor: isChecked ? tpl.color : theme.borderLight,
                          },
                        ]}
                      >
                        {isChecked && <Ionicons name="checkmark" size={15} color="#FFFFFF" />}
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Pressable
                onPress={handleFinishOnboarding}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  { backgroundColor: pressed ? theme.accentMuted : theme.accent },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Get started"
              >
                <Text style={styles.primaryBtnText}>
                  {selectedTemplateIds.length > 0
                    ? `Start with ${selectedTemplateIds.length} habits`
                    : 'Get started'}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleStartEmpty}
                style={styles.emptyLink}
                accessibilityRole="button"
                accessibilityLabel="Start with an empty tracker"
              >
                <Text style={[styles.emptyLinkText, { color: theme.textMuted }]}>
                  Start with a blank tracker
                </Text>
              </Pressable>
            </Animated.View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: Platform.OS === 'android' ? SPACING.xl : SPACING.base,
    paddingBottom: SPACING.xl,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.xl,
  },
  progressDot: {
    height: 6,
    borderRadius: 3,
  },
  stepContainer: {
    flex: 1,
  },
  badgeWrap: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADII.sm,
  },
  badgeText: {
    ...TYPOGRAPHY.tiny,
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    ...TYPOGRAPHY.title1,
    fontSize: 28,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  inputWrap: {
    marginVertical: SPACING.base,
  },
  nameInput: {
    ...TYPOGRAPHY.title2,
    fontSize: 22,
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADII.card,
    borderWidth: 1.5,
  },
  footerSpacing: {
    flex: 1,
  },
  focusList: {
    gap: SPACING.sm,
    flex: 1,
    marginBottom: SPACING.md,
  },
  focusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
    borderRadius: RADII.card,
    borderWidth: 1.5,
    minHeight: 74,
  },
  focusIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  focusTextWrap: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  focusTitle: {
    ...TYPOGRAPHY.headline,
    fontSize: 16,
  },
  focusSubtitle: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  focusCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateScroll: {
    flex: 1,
    marginBottom: SPACING.md,
  },
  templateScrollContent: {
    gap: SPACING.sm,
  },
  templateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADII.card,
    borderWidth: 1.5,
    minHeight: 64,
  },
  templateIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  templateTextWrap: {
    flex: 1,
  },
  templateName: {
    ...TYPOGRAPHY.headline,
    fontSize: 15,
  },
  templateMeta: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    marginTop: 2,
  },
  templateCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.base,
    borderRadius: RADII.card,
    minHeight: TOUCH_TARGET,
  },
  primaryBtnText: {
    ...TYPOGRAPHY.headline,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyLink: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  emptyLinkText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
  },
});
