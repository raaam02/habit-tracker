import { db } from "./database";
import { HabitLog } from "@/types/habit";

export function insertHabitLog(log: HabitLog) {
  // Check if a log already exists for this habit today (to UPSERT)
  const existing = db.getFirstSync<{ id: string }>(
    `SELECT id FROM habit_logs WHERE habitId = ? AND date = ?`,
    [log.habitId, log.date]
  );

  if (existing) {
    db.runSync(
      `UPDATE habit_logs
       SET status = ?, reason = ?, completedTime = ?
       WHERE id = ?`,
      [
        log.status,
        log.reason ?? null,
        log.completedTime ?? null,
        existing.id,
      ]
    );
  } else {
    db.runSync(
      `INSERT INTO habit_logs
      (id, habitId, date, status, reason, completedTime, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        log.id,
        log.habitId,
        log.date,
        log.status,
        log.reason ?? null,
        log.completedTime ?? null,
        log.createdAt,
      ]
    );
  }
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

export function getLogForHabitToday(habitId: string) {
  const today = new Date().toISOString().split("T")[0];
  return db.getFirstSync<HabitLog>(
    `SELECT * FROM habit_logs WHERE habitId = ? AND date = ?`,
    [habitId, today]
  );
}
