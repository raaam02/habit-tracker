import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Habit } from '../types/habit';

// Configure notification behavior for native
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Request notification permissions (Android / iOS)
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
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
    // Cancel all existing scheduled notifications
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

      // Schedule for each weekday
      for (const weekday of habit.scheduledDays) {
        // Expo Notifications weekday: 1 = Sunday, 2 = Monday, ..., 7 = Saturday
        const expoWeekday = weekday + 1;

        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Time for ${habit.name}`,
            body: `Keep your streak going! Tap to mark as done.`,
            data: { habitId: habit.id },
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
