import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../constants/useAppTheme';
import { useHabitStore } from '../store/habitStore';
import { syncHabitReminders } from '../services/notifications';

function AppShell() {
  const { theme, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const hasCompletedOnboarding = useHabitStore(
    (state) => state.settings.hasCompletedOnboarding
  );
  const habits = useHabitStore((state) => state.habits);
  const remindersEnabled = useHabitStore((state) => state.settings.remindersEnabled);
  const router = useRouter();
  const segments = useSegments();

  // Sync notifications when habits or settings change
  useEffect(() => {
    syncHabitReminders(habits, remindersEnabled);
  }, [habits, remindersEnabled]);

  // Navigate to onboarding if first launch
  useEffect(() => {
    const inOnboarding = segments[0] === 'onboarding';
    if (!hasCompletedOnboarding && !inOnboarding) {
      router.replace('/onboarding');
    }
  }, [hasCompletedOnboarding, segments]);

  // On Android, ensure content never slips behind the status bar
  const androidTopInset = Platform.OS === 'android' ? Math.max(insets.top, 24) : 0;

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {/* On desktop web, center app in max 520px column */}
      <View style={[styles.outerContainer, { backgroundColor: theme.background }]}>
        <View
          style={[
            styles.appContainer,
            {
              backgroundColor: theme.background,
              borderColor: Platform.OS === 'web' ? theme.border : 'transparent',
              paddingTop: androidTopInset,
            },
          ]}
        >
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: theme.background },
              animation: 'fade',
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen
              name="habit/[id]"
              options={{
                presentation: Platform.OS === 'ios' ? 'formSheet' : 'modal',
                sheetAllowedDetents: [0.65, 0.95],
                sheetGrabberVisible: true,
                sheetCornerRadius: 32,
                headerShown: false,
              }}
            />
          </Stack>
        </View>
      </View>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AppShell />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  outerContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 520, // Max 520px container on web desktop
    borderLeftWidth: Platform.OS === 'web' ? 1 : 0,
    borderRightWidth: Platform.OS === 'web' ? 1 : 0,
    overflow: 'hidden',
  },
});
