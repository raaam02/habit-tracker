import { db } from "@/db/database";
import { HabitInput } from "@/types/habit";

export function insertHabit(habit: HabitInput) {
  db.runSync(
    `INSERT INTO habits 
    (id, name, icon, colorName, color, bgColor, startDate, reminderTime, duration, frequency, days, reminderEnabled)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      habit.id,
      habit.name,
      habit.icon,
      habit.colorName,
      habit.color,
      habit.bgColor,
      habit.startDate,
      habit.reminderTime,
      habit.duration ?? 0,
      habit.frequency,
      JSON.stringify(habit.days),
      habit.reminderEnabled ? 1 : 0,
    ]
  );
}

export function getHabits(): HabitInput[] {
  const rows = db.getAllSync(`SELECT * FROM habits`);

  return rows.map((row: any) => ({
    ...row,
    days: JSON.parse(row.days),
    reminderEnabled: !!row.reminderEnabled,
  }));
}