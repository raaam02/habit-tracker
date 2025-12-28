import React from "react";
import { View, Text, Image, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";

// Mock Data
const habits = [
  {
    id: 1,
    title: "Morning Run",
    streak: 12,
    completed: true,
    icon: "walk-outline",
    color: "bg-emerald-100",
    iconColor: "#059669", // emerald-600
  },
  {
    id: 2,
    title: "Read 30 mins",
    streak: 5,
    completed: false,
    icon: "book-outline",
    color: "bg-gray-100", // slate-100
    iconColor: "#475569", // slate-600
  },
  {
    id: 3,
    title: "Drink Water",
    streak: 21,
    completed: true,
    icon: "water-outline",
    color: "bg-blue-100",
    iconColor: "#2563EB", // blue-600
  },
  {
    id: 4,
    title: "Meditation",
    streak: 45,
    completed: false,
    icon: "flower-outline",
    color: "bg-violet-100",
    iconColor: "#7C3AED", // violet-600
  },
];

export default function SettingsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#F7F8FA]">
      <ScrollView className="flex-1 px-6 pb-20" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row justify-between items-center mt-6 mb-8">
          <View className="flex-row items-center space-x-4 gap-4">
            <View className="h-12 w-12 bg-orange-200 rounded-full items-center justify-center overflow-hidden">
               {/* Placeholder Avatar */}
              <Image 
                source={{ uri: 'https://i.pravatar.cc/150?img=32' }} 
                className="h-full w-full"
              />
            </View>
            <View>
              <Text className="text-gray-500 text-xs font-medium uppercase tracking-wider">
                Welcome Back
              </Text>
              <Text className="text-xl font-bold text-gray-900">
                Alex Mitchell
              </Text>
            </View>
          </View>
          <TouchableOpacity className="h-10 w-10 bg-white rounded-full items-center justify-center shadow-sm">
            <Ionicons name="notifications-outline" size={20} color="#374151" />
            <View className="absolute top-2 right-2.5 h-2 w-2 bg-red-500 rounded-full border border-white" />
          </TouchableOpacity>
        </View>

        {/* Progress Section */}
        <View className="mb-8">
          <Text className="text-indigo-600 font-semibold mb-1 uppercase text-xs tracking-wider">
            Thursday, 12 Oct
          </Text>
          <View className="flex-row items-baseline mb-4">
             <Text className="text-3xl font-extrabold text-gray-900 mr-2">
              Keep the{"\n"}streak alive
            </Text>
            <Text className="text-3xl">🔥</Text>
          </View>

          <View className="flex-row justify-between items-end mb-2">
             <Text className="text-gray-500 font-medium">Daily Progress</Text>
             <Text className="text-indigo-600 font-bold">40%</Text>
          </View>
          <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <View className="h-full bg-indigo-600 w-[40%] rounded-full" />
          </View>
        </View>

        {/* Habits List */}
        <View className="space-y-4 gap-4 mb-24">
          {habits.map((habit) => (
            <TouchableOpacity
              key={habit.id}
              className="bg-white p-4 rounded-3xl flex-row items-center justify-between shadow-sm border border-gray-100"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center gap-4">
                <View className={`h-12 w-12 rounded-full items-center justify-center ${habit.color}`}>
                  <Ionicons name={habit.icon as any} size={24} color={habit.iconColor} />
                </View>
                <View>
                  <Text className="text-lg font-bold text-gray-900">
                    {habit.title}
                  </Text>
                  <Text className="text-gray-500 font-semibold">
                    <Text className="text-gray-900 font-bold">{habit.streak}</Text> day streak
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                className={`h-14 w-14 rounded-full items-center justify-center ${
                  habit.completed ? "bg-emerald-500 shadow-md shadow-emerald-200" : "bg-gray-100 border border-gray-200"
                }`}
              >
                {habit.completed && (
                  <Ionicons name="checkmark" size={28} color="white" />
                )}
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      
      {/* Floating Action Button */}
      <View className="absolute bottom-6 w-full items-center">
         <TouchableOpacity 
            className="flex-row items-center bg-indigo-600 px-6 py-4 rounded-full shadow-lg shadow-indigo-300"
            activeOpacity={0.8}
         >
            <Ionicons name="add" size={24} color="white" className="mr-2" />
             <Text className="text-white font-bold text-lg ml-2">Add Habit</Text>
         </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
