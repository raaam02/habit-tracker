import { insertHabit } from "@/db/habit.repository";
import { HabitInput } from "@/types/habit";
import { randomUUID } from "expo-crypto";

export function createHabit(data: Omit<HabitInput, "id">) {
  const habit: HabitInput = {
    id: randomUUID(),
    ...data,
  };

  insertHabit(habit);

  return habit;
}