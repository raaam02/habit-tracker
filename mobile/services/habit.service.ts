import { insertHabit } from "@/db/habit.repository";
import { HabitInput } from "@/types/habit";
import { randomUUID } from "expo-crypto";

export function createHabit(data: Omit<HabitInput, "id">) {
  const habit: HabitInput = {
    id: randomUUID(),
    ...data,
    colorName: data.colorName,
    color: data.color,
    bgColor: data.bgColor,
  };

  insertHabit(habit);

  return habit;
}