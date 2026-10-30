import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Habit } from '../types/habit';

// Configure notification behavior for native
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Configure Android Notification Channel (Required on Android 8.0+)
 */
export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('habit_reminders', {
        name: 'Habit Reminders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3B82F6',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    } catch (e) {
      console.warn('Could not setup Android notification channel:', e);
    }
  }
}

/**
 * Request notification permissions (Android / iOS)
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    await setupNotificationChannel();

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch {
    return false;
  }
}

/**
 * Reschedule all active habit reminders.
 */
export async function syncHabitReminders(habits: Habit[], remindersEnabled: boolean): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (!remindersEnabled) return;

    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;

    for (const habit of habits) {
      if (habit.archivedAt || !habit.reminderTime) continue;

      const [hourStr, minStr] = habit.reminderTime.split(':');
      const hour = parseInt(hourStr, 10);
      const minute = parseInt(minStr, 10);

      if (isNaN(hour) || isNaN(minute)) continue;

      for (const weekday of habit.scheduledDays) {
        // Expo Notifications weekday: 1 = Sunday, 2 = Monday, ..., 7 = Saturday
        const expoWeekday = weekday + 1;

        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Time for ${habit.name}`,
            body: `Keep your streak thriving! Tap to log progress.`,
            data: { habitId: habit.id },
            sound: 'default',
            ...(Platform.OS === 'android' ? { channelId: 'habit_reminders' } : {}),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: expoWeekday,
            hour,
            minute,
          },
        });
      }
    }
  } catch (err) {
    console.warn('Failed to sync habit reminders:', err);
  }
}

/**
 * Send an immediate test notification to verify the pipeline.
 */
export async function triggerTestNotification(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return false;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Habit Tracker Reminder 🎯',
        body: 'Notifications are working! Your scheduled habits will remind you on time.',
        sound: 'default',
        ...(Platform.OS === 'android' ? { channelId: 'habit_reminders' } : {}),
      },
      trigger: null, // trigger immediately
    });
    return true;
  } catch (e) {
    console.warn('Test notification failed:', e);
    return false;
  }
}
