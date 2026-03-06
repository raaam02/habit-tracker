import { getLogsForHabit } from "@/db/habit-log.repository";
import { today, dateDaysAgo } from "@/utils/date";

export function calculateCurrentStreak(habitId: string) {
  const logs: any[] = getLogsForHabit(habitId);

  let streak = 0;
  let daysBack = 0;

  while (true) {
    const targetDate = dateDaysAgo(daysBack);

    const log = logs.find((l) => l.date === targetDate);

    if (!log || log.status !== "done") {
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
    if (log.status === "done") {
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

  const done = logs.filter((l) => l.status === "done").length;

  return Math.round((done / logs.length) * 100);
}