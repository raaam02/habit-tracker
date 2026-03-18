import { getLogsForHabit } from "@/db/habit-log.repository";
import { today, dateDaysAgo } from "@/utils/date";

export function calculateCurrentStreak(habitId: string) {
  const logs: any[] = getLogsForHabit(habitId);

  let streak = 0;
  let daysBack = 0;

  while (true) {
    const targetDate = dateDaysAgo(daysBack);

    const log = logs.find((l) => l.date === targetDate);

    // Completion condition: status is done or completedTime >= targetTime
    // Fallback: if targetTime is null, use status === "done" for old logs
    const isCompleted = log && (
      log.status === "done" || 
      (log.completedTime != null && log.targetTime != null && log.completedTime >= log.targetTime)
    );

    if (!isCompleted) {
      break;
    }

    streak++;
    daysBack++;
  }

  return streak;
}

export function calculateBestStreak(habitId: string) {
  const logs: any[] = getLogsForHabit(habitId);

  let best = 0;
  let current = 0;

  const sorted = logs.sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  for (const log of sorted) {
    const isCompleted = log.status === "done" || 
      (log.completedTime != null && log.targetTime != null && log.completedTime >= log.targetTime);

    if (isCompleted) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }

  return best;
}

export function completionRate(habitId: string) {
  const logs: any[] = getLogsForHabit(habitId);

  if (logs.length === 0) return 0;

  const done = logs.filter((log) => 
    log.status === "done" || 
    (log.completedTime != null && log.targetTime != null && log.completedTime >= log.targetTime)
  ).length;

  return Math.round((done / logs.length) * 100);
}