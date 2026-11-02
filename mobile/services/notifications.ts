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
 * Configure Android Running Timer Notification Channel
 */
export async function setupTimerNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('running_timer', {
        name: 'Running Habit Timer',
        importance: Notifications.AndroidImportance.HIGH,
        sound: undefined,
        enableVibrate: false,
        showBadge: false,
      });
    } catch (e) {
      console.warn('Could not setup timer notification channel:', e);
    }
  }
}

const TIMER_NOTIFICATION_ID = 'active_habit_timer_notification';
const getGoalNotificationId = (habitId: string) => `timer_goal_${habitId}`;

/**
 * Show background timer notification when app is minimized or backgrounded
 */
export async function showBackgroundTimerNotification(
  habitName: string,
  elapsedSeconds: number,
  targetMinutes: number,
  habitId: string
): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;

    await setupTimerNotificationChannel();

    const targetSeconds = targetMinutes * 60;
    const remainingSeconds = Math.max(0, targetSeconds - elapsedSeconds);
    const isCompleted = elapsedSeconds >= targetSeconds;

    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    // 1. Show immediate notification that timer is running in background
    await Notifications.scheduleNotificationAsync({
      identifier: TIMER_NOTIFICATION_ID,
      content: {
        title: isCompleted ? `🎉 ${habitName} Goal Reached!` : `⏱️ ${habitName} Timer Running`,
        body: isCompleted
          ? `Target of ${targetMinutes}m complete! Tap to log and protect your streak.`
          : `${timeFormatted} elapsed of ${targetMinutes}m goal • Running in background`,
        sound: isCompleted ? 'default' : undefined,
        sticky: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        ...(Platform.OS === 'android' ? { channelId: 'running_timer' } : {}),
      },
      trigger: null, // immediate
    });

    // 2. If target not yet hit, schedule goal notification for exact remaining seconds
    if (!isCompleted && remainingSeconds > 0) {
      await Notifications.scheduleNotificationAsync({
        identifier: getGoalNotificationId(habitId),
        content: {
          title: `🎯 Goal Reached: ${habitName}!`,
          body: `You completed your ${targetMinutes} minute goal. Tap to save!`,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
          ...(Platform.OS === 'android' ? { channelId: 'habit_reminders' } : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: remainingSeconds,
        },
      });
    }
  } catch (e) {
    console.warn('Failed to post background timer notification:', e);
  }
}

/**
 * Cancel background timer notification when user returns or stops timer
 */
export async function cancelBackgroundTimerNotification(habitId?: string): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.dismissNotificationAsync(TIMER_NOTIFICATION_ID);
    if (habitId) {
      await Notifications.cancelScheduledNotificationAsync(getGoalNotificationId(habitId));
    }
  } catch (e) {
    // ignore dismissal errors
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


