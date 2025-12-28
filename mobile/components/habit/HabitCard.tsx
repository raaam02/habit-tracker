import { Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Habit } from '@/app/types/types';

interface HabitCardProps {
  habit: Habit, 
  handleHabitComplete: () => void
}

function HabitCard({ habit, handleHabitComplete }: HabitCardProps) {
  return (
    <TouchableOpacity
      key={habit.id.toString()}
      className="bg-white p-4 rounded-3xl flex-row items-center justify-between border border-gray-100"
      activeOpacity={0.7}
    >
      <View className="flex-row items-center gap-4">
        <View className={`h-12 w-12 rounded-full items-center justify-center ${habit.color}`}>
          <Ionicons name={habit.icon as any} size={24} color={habit.iconColor} />
        </View>
        <View>
          <Text className="text-lg font-bold text-gray-900">
            {habit.name}
          </Text>
          <Text className="text-gray-500 font-semibold">
            <Text className="text-gray-900 font-bold">{habit.streak}</Text> day streak
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={handleHabitComplete}
        className={`h-14 w-14 rounded-full items-center justify-center ${
          habit.done ? "bg-emerald-500 shadow-md shadow-emerald-200" : "bg-gray-100 border border-gray-200"
        }`}
      >
        {habit.done && (
          <Ionicons name="checkmark" size={28} color="white" />
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  )
}

export default HabitCard;