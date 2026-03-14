import { insertHabitLog, getLogForHabitToday } from "@/db/habit-log.repository";
import { HabitLog } from "@/types/habit";
import { randomUUID } from "expo-crypto";

export function markHabitDone(habitId: string, completedTime?: number) {
  console.log("habitId: ", habitId);
  console.log("completedTime: ", completedTime); 
  console.log("date: ", new Date().toISOString().split("T")[0]); 
  const log: HabitLog = {
    id: randomUUID(),
    habitId,
    date: new Date().toISOString().split("T")[0],
    status: "done",
    completedTime,
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

export { getLogForHabitToday };