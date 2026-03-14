import * as SQLite from "expo-sqlite";

export const db = SQLite.openDatabaseSync("habits.db");

export function initDatabase() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      icon TEXT,
      colorName TEXT,
      color TEXT,
      bgColor TEXT,
      startDate TEXT,
      reminderTime TEXT,
      duration INTEGER,
      frequency INTEGER,
      days TEXT,
      reminderEnabled INTEGER
    );

    CREATE TABLE IF NOT EXISTS habit_logs (
      id TEXT PRIMARY KEY NOT NULL,
      habitId TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      reason TEXT,
      completedTime INTEGER,
      createdAt TEXT,
      FOREIGN KEY (habitId) REFERENCES habits(id)
    );
  `);

  try {
    db.execSync(`ALTER TABLE habit_logs ADD COLUMN completedTime INTEGER;`);
  } catch (e) {
    // Column already exists or another error, ignore
  }
}