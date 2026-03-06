import { Pressable, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Habit } from '@/types/habit';
import { router } from 'expo-router';

interface HabitCardProps {
  habit: Habit, 
  handleHabitComplete: () => void
}

function HabitCard({ habit, handleHabitComplete }: HabitCardProps) {
  return (
    <TouchableOpacity
      key={habit.id.toString()}
      className="bg-card p-4 rounded-3xl flex-row items-center justify-between"
      activeOpacity={0.7}
      onPress={() => {
        router.push(`/habit/${habit.id}`);
      }}
    >
      <View className="flex-row items-center gap-4">
        <View className={`h-12 w-12 rounded-full items-center justify-center ${habit.color}`}>
          <Ionicons name={habit.icon as any} size={24} color={habit.iconColor} />
        </View>
        <View>
          <Text className="font-bold text-foreground">
            {habit.name}
          </Text>
          <Text className="text-gray-500 font-semibold">
            <Text className="text-muted-foreground text-xs font-bold">{habit.streak}</Text> day streak
          </Text>
        </View>
      </View>

      <Pressable
        onPress={handleHabitComplete}
        className={`h-14 w-14 rounded-full items-center justify-center
          ${habit.done ? "bg-emerald-500" : "bg-muted border border-border"}
        `}
      >
        {habit.done && (
          <Ionicons name="checkmark" size={28} color="white" />
        )}
      </Pressable>
    </TouchableOpacity>
  )
}

export default HabitCard;