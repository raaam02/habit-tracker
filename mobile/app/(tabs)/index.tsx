import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { useState } from "react";
import MonthlyGrowthChart from "@/components/charts/MonthlyGrowthChart";
import StreakLevelBadge from "@/components/charts/StreakLevelBadge";
import AddHabitSheet from "@/components/habit/AddHabitSheet";
import Card from "@/components/ui/Card";
import { SafeAreaView } from "react-native-safe-area-context";
import { Habit } from "@/types/habit";
import { Ionicons } from "@expo/vector-icons";
import Habits from "@/components/habit/Habits";

const MOCK_HABITS: Habit[] = [
  { 
    id: 1, 
    name: "Morning Run", 
    streak: 12, 
    icon: "walk-outline",
    color: "bg-emerald-100",
    iconColor: "#059669",
    done: true 
  },
  {
    id: 2,
    name: "Read 30 mins",
    streak: 5,
    icon: "book-outline",
    color: "bg-gray-100",
    iconColor: "#475569",
    done: false
  },
  {
    id: 3,
    name: "Drink Water",
    streak: 21,
    icon: "water-outline",
    color: "bg-blue-100",
    iconColor: "#2563EB",
    done: true
  },
  {
    id: 4,
    name: "Meditation",
    streak: 45,
    icon: "flower-outline",
    color: "bg-violet-100",
    iconColor: "#7C3AED",
    done: false
  },
];

export default function HomeScreen() {
  const [openHabitSheet, setOpenHabitSheet] = useState(false);
  const [habits, setHabits] = useState<Habit[]>(MOCK_HABITS);

  return (
    <>
    <SafeAreaView className="flex-1 bg-[#F7F8FA]">
        <ScrollView className="flex-1 bg-bg px-screen pt-6">
          {/* HEADER */}
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
          

          {/* STREAK SUMMARY */}
          <Card>
            <View className="flex-row items-center justify-between">
              <View>
                <View className="">
                  <Text className="text-muted text-sm">THURSDAY, 12 OCT</Text>
                </View>
                <Text className="text-3xl font-bold mt-1">14 days</Text>
                <Text className="font-bold text-muted mt-1">
                  Keep the streak alive 🔥
                </Text>
              </View>
              <StreakLevelBadge streak={14} />
            </View>
          </Card>

          {/* MONTHLY GROWTH */}
          <View className="mt-6">
            <View className="flex-row justify-between mb-2">
              <Text className="text-lg font-semibold">Monthly Growth</Text>
              <Text className="text-primary font-medium">View details</Text>
            </View>
            <MonthlyGrowthChart />
          </View>

          {/* TODAY HABITS */}
          <Habits habits={habits} setHabits={setHabits} />
        </ScrollView>

        {/* FLOATING ADD BUTTON */}
        <View className="absolute bottom-2 right-2">
          <TouchableOpacity
            onPress={() => {
              setOpenHabitSheet(true);
            }}
            className="bg-primary px-6 py-4 rounded-full shadow-card flex-row items-center justify-center"
          >
            <Text className="text-white text-lg">+ Add Habit</Text>
          </TouchableOpacity>
        </View>

        <AddHabitSheet open={openHabitSheet} onClose={() => setOpenHabitSheet(false)} />
      </SafeAreaView>
    </>
  );
}
