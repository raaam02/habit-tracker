import { insertHabitLog, getLogForHabitToday } from "@/db/habit-log.repository";
import { getHabitById } from "@/db/habit.repository";
import { HabitLog } from "@/types/habit";
import { randomUUID } from "expo-crypto";

export function updateHabitProgress(habitId: string, seconds: number) {
  const habit = getHabitById(habitId);
  if (!habit) return null;

  const targetTime = (habit.duration || 0) * 60;
  const today = new Date().toISOString().split("T")[0];
  const existingLog = getLogForHabitToday(habitId);

  const completedTime = seconds;
  const status = completedTime >= targetTime ? "done" : "in_progress";

  const log: HabitLog = {
    id: existingLog?.id || randomUUID(),
    habitId,
    date: today,
    status,
    completedTime,
    targetTime,
    createdAt: existingLog?.createdAt || new Date().toISOString(),
  };

  insertHabitLog(log);

  return log;
}

export function markHabitMissed(habitId: string, reason: string) {
  const habit = getHabitById(habitId);
  const targetTime = habit ? (habit.duration || 0) * 60 : 0;
  
  const log: HabitLog = {
    id: randomUUID(),
    habitId,
    date: new Date().toISOString().split("T")[0],
    status: "missed",
    reason,
    targetTime,
    createdAt: new Date().toISOString(),
  };

  insertHabitLog(log);

  return log;
}

export { getLogForHabitToday };