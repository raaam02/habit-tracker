import { insertHabitLog } from "@/db/habit-log.repository";
import { HabitLog } from "@/types/habit";
import { randomUUID } from "expo-crypto";

export function markHabitDone(habitId: string) {
  const log: HabitLog = {
    id: randomUUID(),
    habitId,
    date: new Date().toISOString().split("T")[0],
    status: "done",
    createdAt: new Date().toISOString(),
  };

  insertHabitLog(log);

  return log;
}

export function markHabitMissed(habitId: string, reason: string) {
  const log: HabitLog = {
    id: randomUUID(),
    habitId,
    date: new Date().toISOString().split("T")[0],
    status: "missed",
    reason,
    createdAt: new Date().toISOString(),
  };

  insertHabitLog(log);

  return log;
}