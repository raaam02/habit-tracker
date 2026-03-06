import * as SQLite from "expo-sqlite";

export const db = SQLite.openDatabaseSync("habits.db");

export function initDatabase() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
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
      createdAt TEXT,
      FOREIGN KEY (habitId) REFERENCES habits(id)
    );
  `);
}