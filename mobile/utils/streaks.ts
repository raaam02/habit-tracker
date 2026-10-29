import { Habit, HabitLog, StreakStats } from '../types/habit';
import {
  getTodayDateString,
  getWeekday,
  shiftDateString,
  daysBetween,
  parseLocalDate,
} from './date';

/**
 * Checks if a specific date was a completed day for the habit.
 */
export function isDayCompleted(habit: Habit, log: HabitLog | undefined): boolean {
  if (!log) return false;
  if (log.skipped) return false;
  return log.value >= habit.target;
}

/**
 * Checks if a date was skipped.
 */
export function isDaySkipped(log: HabitLog | undefined): boolean {
  return !!log?.skipped;
}

/**
 * Checks if a date was scheduled for this habit.
 */
export function isDayScheduled(habit: Habit, dateString: string): boolean {
  const weekday = getWeekday(dateString);
  return habit.scheduledDays.includes(weekday);
}

/**
 * Pure function to compute all streak statistics for a habit from logs.
 *
 * Never-miss-twice rule:
 * - One missed scheduled day does NOT break the streak.
 * - Two consecutive missed scheduled days DO break the streak.
 * - Skipping a day does NOT count as a miss.
 * - Unscheduled days are completely ignored.
 * - At risk: The last scheduled day before today was missed, and today is scheduled but not completed yet.
 */
export function computeStreakStats(
  habit: Habit,
  logs: HabitLog[],
  today: string = getTodayDateString()
): StreakStats {
  // Build a lookup map of logs by date string
  const logsByDate = new Map<string, HabitLog>();
  let totalCompletions = 0;
  let lastCompletedDate: string | null = null;

  for (const log of logs) {
    if (log.habitId === habit.id) {
      logsByDate.set(log.date, log);
      if (isDayCompleted(habit, log)) {
        totalCompletions++;
        if (!lastCompletedDate || log.date > lastCompletedDate) {
          lastCompletedDate = log.date;
        }
      }
    }
  }

  // 1. Completion rates over past 7 and 30 days
  let scheduled7d = 0;
  let completed7d = 0;
  for (let i = 0; i < 7; i++) {
    const d = shiftDateString(today, -i);
    if (isDayScheduled(habit, d)) {
      const log = logsByDate.get(d);
      if (!isDaySkipped(log)) {
        scheduled7d++;
        if (isDayCompleted(habit, log)) {
          completed7d++;
        }
      }
    }
  }
  const completionRate7d = scheduled7d > 0 ? Math.round((completed7d / scheduled7d) * 100) : 0;

  let scheduled30d = 0;
  let completed30d = 0;
  for (let i = 0; i < 30; i++) {
    const d = shiftDateString(today, -i);
    if (isDayScheduled(habit, d)) {
      const log = logsByDate.get(d);
      if (!isDaySkipped(log)) {
        scheduled30d++;
        if (isDayCompleted(habit, log)) {
          completed30d++;
        }
      }
    }
  }
  const completionRate30d = scheduled30d > 0 ? Math.round((completed30d / scheduled30d) * 100) : 0;

  // 2. Identify creation date constraint
  const habitCreationDate = habit.createdAt.slice(0, 10);

  // 3. Collect all scheduled dates from creation date up to today in chronological order
  const scheduledDates: string[] = [];
  let curr = habitCreationDate;
  // Safety bound: at least 365 days or from creation date
  const minDate = shiftDateString(today, -365);
  if (curr < minDate) {
    curr = minDate;
  }

  while (curr <= today) {
    if (isDayScheduled(habit, curr)) {
      scheduledDates.push(curr);
    }
    curr = shiftDateString(curr, 1);
  }

  if (scheduledDates.length === 0) {
    return {
      currentStreak: 0,
      bestStreak: 0,
      completionRate7d,
      completionRate30d,
      isAtRisk: false,
      lastCompletedDate,
      totalCompletions,
    };
  }

  // Check today's status
  const isTodayScheduled = isDayScheduled(habit, today);
  const todayLog = logsByDate.get(today);
  const isTodayDone = isDayCompleted(habit, todayLog);

  // 4. Calculate Current Streak (working backwards from today or yesterday)
  let currentStreak = 0;
  let consecutiveMisses = 0;
  let isAtRisk = false;

  // Find index of today or last scheduled date <= today
  const lastScheduledIndex = scheduledDates.length - 1;
  const lastScheduledDate = scheduledDates[lastScheduledIndex];

  let startIndex = lastScheduledIndex;
  if (lastScheduledDate === today) {
    if (isTodayDone) {
      currentStreak++;
      startIndex = lastScheduledIndex - 1;
    } else {
      // Today is scheduled but not completed yet.
      // Check if previous scheduled day was missed -> at risk!
      const prevScheduledIndex = lastScheduledIndex - 1;
      if (prevScheduledIndex >= 0) {
        const prevDate = scheduledDates[prevScheduledIndex];
        const prevLog = logsByDate.get(prevDate);
        if (!isDayCompleted(habit, prevLog) && !isDaySkipped(prevLog)) {
          isAtRisk = true;
        }
      }
      startIndex = lastScheduledIndex - 1;
    }
  }

  // Traverse backwards
  for (let i = startIndex; i >= 0; i--) {
    const d = scheduledDates[i];
    const log = logsByDate.get(d);

    if (isDayCompleted(habit, log)) {
      currentStreak++;
      consecutiveMisses = 0; // Reset consecutive misses on completion
    } else if (isDaySkipped(log)) {
      // Skipped day does not count as a miss and does not break streak
      continue;
    } else {
      // Missed scheduled day
      consecutiveMisses++;
      if (consecutiveMisses >= 2) {
        // Two consecutive misses break the streak
        break;
      }
    }
  }

  // If there were 2 consecutive misses before today (e.g. yesterday and the day before were missed),
  // and today wasn't completed, current streak is 0 and it's no longer just at risk, it's broken.
  if (!isTodayDone && startIndex >= 0) {
    const prevDate = scheduledDates[startIndex];
    const prevLog = logsByDate.get(prevDate);
    const prevPrevIndex = startIndex - 1;
    if (prevPrevIndex >= 0) {
      const prevPrevDate = scheduledDates[prevPrevIndex];
      const prevPrevLog = logsByDate.get(prevPrevDate);
      if (
        !isDayCompleted(habit, prevLog) &&
        !isDaySkipped(prevLog) &&
        !isDayCompleted(habit, prevPrevLog) &&
        !isDaySkipped(prevPrevLog)
      ) {
        currentStreak = 0;
        isAtRisk = false;
      }
    }
  }

  // 5. Calculate Best Streak across the full timeline
  let bestStreak = 0;
  let runningStreak = 0;
  let runningMisses = 0;

  for (let i = 0; i < scheduledDates.length; i++) {
    const d = scheduledDates[i];
    const log = logsByDate.get(d);

    if (isDayCompleted(habit, log)) {
      runningStreak++;
      runningMisses = 0;
      if (runningStreak > bestStreak) {
        bestStreak = runningStreak;
      }
    } else if (isDaySkipped(log)) {
      // Skipped day preserves streak
      continue;
    } else {
      runningMisses++;
      if (runningMisses >= 2) {
        // Reset streak on two consecutive misses
        runningStreak = 0;
        runningMisses = 0;
      }
    }
  }

  if (currentStreak > bestStreak) {
    bestStreak = currentStreak;
  }

  return {
    currentStreak,
    bestStreak,
    completionRate7d,
    completionRate30d,
    isAtRisk,
    lastCompletedDate,
    totalCompletions,
  };
}
