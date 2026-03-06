import { db } from "./database";
import { HabitLog } from "@/types/habit";

export function insertHabitLog(log: HabitLog) {
  db.runSync(
    `INSERT INTO habit_logs
    (id, habitId, date, status, reason, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)`,
    [
      log.id,
      log.habitId,
      log.date,
      log.status,
      log.reason ?? null,
      log.createdAt,
    ]
  );
}

export function getLogsForHabit(habitId: string) {
  return db.getAllSync(
    `SELECT * FROM habit_logs 
     WHERE habitId = ?
     ORDER BY date DESC`,
    [habitId]
  );
}

export function getLogsForDate(date: string) {
  return db.getAllSync(
    `SELECT * FROM habit_logs WHERE date = ?`,
    [date]
  );
}
