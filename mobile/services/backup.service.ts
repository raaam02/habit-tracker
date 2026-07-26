import { db } from "@/db/database";

export function exportBackupData(): string {
  const habits = db.getAllSync(`SELECT * FROM habits`);
  const logs = db.getAllSync(`SELECT * FROM habit_logs`);
  const profile = db.getAllSync(`SELECT * FROM user_profile`);
  
  return JSON.stringify({
    version: 1,
    habits,
    habit_logs: logs,
    user_profile: profile
  });
}

export function importBackupData(jsonString: string): { success: boolean; error?: string } {
  try {
    const data = JSON.parse(jsonString);
    if (!data.habits || !data.habit_logs) {
      return { success: false, error: "Invalid backup data: missing habits or logs." };
    }
    
    // Clear current database
    db.execSync("DELETE FROM habit_logs;");
    db.execSync("DELETE FROM habits;");
    db.execSync("DELETE FROM user_profile;");
    
    // Restore User Profile
    if (data.user_profile && Array.isArray(data.user_profile)) {
      data.user_profile.forEach((p: any) => {
        db.runSync(
          `INSERT INTO user_profile (id, name, email, avatar, onboardingCompleted) 
           VALUES (?, ?, ?, ?, ?)`,
          [p.id, p.name, p.email, p.avatar, p.onboardingCompleted]
        );
      });
    }
    
    // Restore Habits
    if (Array.isArray(data.habits)) {
      data.habits.forEach((h: any) => {
        db.runSync(
          `INSERT INTO habits 
          (id, name, icon, colorName, color, bgColor, startDate, reminderTime, duration, frequency, days, reminderEnabled)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            h.id,
            h.name,
            h.icon,
            h.colorName,
            h.color,
            h.bgColor,
            h.startDate,
            h.reminderTime,
            h.duration,
            h.frequency,
            h.days,
            h.reminderEnabled
          ]
        );
      });
    }

    // Restore Habit Logs
    if (Array.isArray(data.habit_logs)) {
      data.habit_logs.forEach((l: any) => {
        db.runSync(
          `INSERT INTO habit_logs 
          (id, habitId, date, status, reason, completedTime, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            l.id,
            l.habitId,
            l.date,
            l.status,
            l.reason,
            l.completedTime,
            l.createdAt
          ]
        );
      });
    }
    
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || "Failed to parse backup JSON." };
  }
}
