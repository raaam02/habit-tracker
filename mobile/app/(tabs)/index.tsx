import { View, Text, ScrollView, Pressable } from "react-native";
import { useState } from "react";
import MonthlyGrowthChart from "@/components/charts/MonthlyGrowthChart";
import AddHabitSheet from "@/components/habit/AddHabitSheet";
import { SafeAreaView } from "react-native-safe-area-context";
import { Habit } from "@/types/habit";
import Habits from "@/components/habit/Habits";
import StreakSummary from "@/components/StreakSummary";
import WelcomeHeader from "@/components/WelcomeHeader";
import { MOCK_HABITS, MOCK_USER } from "@/utils/mock.data";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  const [openHabitSheet, setOpenHabitSheet] = useState(false);
  const [habits, setHabits] = useState<Habit[]>(MOCK_HABITS);

  return (
    <>
    <SafeAreaView className="flex-1 bg-[#F7F8FA]">
        <ScrollView className="flex-1 bg-bg px-screen pt-6">
          {/* HEADER */}
          <WelcomeHeader user={MOCK_USER} />
          

          {/* STREAK SUMMARY */}
          <StreakSummary streak={14} />

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
        <View className="absolute bottom-4 right-4">
          <Pressable
            onPress={() => setOpenHabitSheet(true)}
            className="bg-primary px-6 py-4 rounded-full shadow-card flex-row items-center justify-center"
          >
            <Text className="text-white text-lg">
              <Ionicons name="add" size={24} color="white" />
            </Text>
          </Pressable>
        </View>

        <AddHabitSheet open={openHabitSheet} onClose={() => setOpenHabitSheet(false)} />
      </SafeAreaView>
    </>
  );
}
