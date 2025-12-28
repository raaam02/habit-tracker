import { View, Text } from 'react-native'
import React from 'react'
import { Habit } from '@/app/types/types'
import HabitCard from './HabitCard';

interface HabitsProps {
  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
}

const Habits = ({habits, setHabits}: HabitsProps) => {

  const handleHabitComplete = (idx: number) => {
    setHabits((prevHabits) => {
      const updatedHabits = [...prevHabits];
      updatedHabits[idx].done = !updatedHabits[idx].done;
      return updatedHabits;
    });
  }
  return (
    <View className="mt-8">
      <Text className="text-lg font-semibold mb-3">Today</Text>
      <View className="grid grid-cols-2 gap-2">
        {habits.map((habit, idx) => (
            <HabitCard key={habit.id} habit={habit} handleHabitComplete={() => handleHabitComplete(idx)} />
        ))}
      </View>
    </View>
  )
}

export default Habits