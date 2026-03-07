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
import { getHabits } from "@/db/habit.repository";
import { haptic } from "@/utils/haptic";

export default function HomeScreen() {
  const [openHabitSheet, setOpenHabitSheet] = useState(false);
  const [habits, setHabits] = useState<Habit[]>(MOCK_HABITS);

  const habitss = getHabits();

  console.log(habitss);

  return (
    <>
    <SafeAreaView className="flex-1 bg-background text-foreground">
        {/* HEADER */}
        <WelcomeHeader user={MOCK_USER} />
        <ScrollView className="p-4" showsVerticalScrollIndicator={false}>
          {/* STREAK SUMMARY */}
          <StreakSummary streak={50} />

          {/* MONTHLY GROWTH */}
          <View className="mt-6 bg-card rounded-3xl p-4 pb-2">
            <View className="flex-row justify-between mb-2">
              <Text className="text-lg font-semibold text-card-foreground">Monthly Growth</Text>
              <Text className="text-primary font-medium">View details</Text>
            </View>
            <MonthlyGrowthChart />
          </View>

          {/* TODAY HABITS */}
          <Habits habits={habits} setHabits={setHabits} />
        </ScrollView>

        {/* FLOATING ADD BUTTON */}
        <View className="absolute bottom-28 right-2">
          <Pressable
            onPress={() => {
              setOpenHabitSheet(true)
              haptic.light()
            }}
            className="bg-primary px-6 py-4 rounded-full shadow-card flex-row items-center justify-center"
          >
            <Ionicons name="add" size={24} color="white" />
          </Pressable>
        </View>

        <AddHabitSheet open={openHabitSheet} onClose={() => setOpenHabitSheet(false)} />
      </SafeAreaView>
    </>
  );
}
