import { View, Text } from 'react-native'
import React from 'react'
import { Habit, HabitInput } from '@/types/habit'
import HabitCard from './HabitCard';

interface HabitsProps {
  habits: HabitInput[];
}

const Habits = ({habits}: HabitsProps) => {

  const handleHabitComplete = (idx: number) => {
    // setHabits((prevHabits) => {
    //   const updatedHabits = [...prevHabits];
    //   updatedHabits[idx].done = !updatedHabits[idx].done;
    //   return updatedHabits;
    // });
  }
  return (
    <View className="mt-8">
      <Text className="text-lg font-semibold mb-3 text-foreground">Today</Text>
      <View className="grid grid-cols-2 gap-2">
        {habits.map((habit, idx) => (
            <HabitCard key={idx} habit={habit} />
        ))}
        <View className="h-48 p-5">
          <Text className="text-center text-muted-foreground/60">No more habits for today</Text>
        </View>
      </View>
    </View>
  )
}

export default Habits