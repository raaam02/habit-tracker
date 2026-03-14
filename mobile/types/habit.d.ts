import { color } from "@/components/IconPicker";

export type Habit = {
    id: number;
    name: string;
    streak: number;
    icon: string;
    color: string;
    iconColor: string;
    done: boolean;
};

export type HabitInput = {
  id: string;
  name: string;

  icon: string;
  colorName: string
  color: string
  bgColor: string

  startDate: string;
  reminderTime: string;

  duration?: number;

  frequency: number;
  days: number[];

  reminderEnabled: boolean;
};

export type HabitLog = {
  id: string;
  habitId: string;
  date: string;
  status: "done" | "missed";
  reason?: string;
  completedTime?: number;
  createdAt: string;
};