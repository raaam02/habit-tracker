import { View, Text, ScrollView, Pressable, FlatList } from "react-native";
import { useEffect, useState } from "react";
import MonthlyGrowthChart from "@/components/charts/MonthlyGrowthChart";
import AddHabitSheet from "@/components/habit/AddHabitSheet";
import { SafeAreaView } from "react-native-safe-area-context";
import { Habit, HabitInput } from "@/types/habit";
import Habits from "@/components/habit/Habits";
import StreakSummary from "@/components/StreakSummary";
import WelcomeHeader from "@/components/WelcomeHeader";
import { MOCK_HABITS, MOCK_USER } from "@/utils/mock.data";
import { Ionicons } from "@expo/vector-icons";
import { getHabits } from "@/db/habit.repository";
import { haptic } from "@/utils/haptic";
import HabitCard from "@/components/habit/HabitCard";
import RunningHabitTimer from "@/components/habit/RunningHabitTimer";

export default function HomeScreen() {
  const [openHabitSheet, setOpenHabitSheet] = useState(false);
  const [habits, setHabits] = useState<HabitInput[]>([]);
  const [editHabit, setEditHabit] = useState<HabitInput | null>(null);
  const [runningHabit, setRunningHabit] = useState<HabitInput | null>(null)

  const loadHabits = () => {
    const data = getHabits()
    setHabits(data)
  }

  useEffect(() => {
    loadHabits()
  }, [])
  

  return (
    <>
    <SafeAreaView className="flex-1 bg-background text-foreground">
      <WelcomeHeader user={MOCK_USER} />
      {habits.length > 0 ? (
        <FlatList
          data={habits}
          keyExtractor={(item) => item.id.toString()}
          className="px-4 rounded-xl"
          renderItem={({ item }) => 
            <HabitCard 
              habit={item} 
              loadHabits={loadHabits} 
              startTimer={setRunningHabit} 
              setEditHabit={setEditHabit} 
              setOpenHabitSheet={setOpenHabitSheet} 
            />
          }
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View>
              {runningHabit ? (
                <RunningHabitTimer
                  habit={runningHabit}
                  onStop={() => setRunningHabit(null)}
                />
              ) : (
                  <View>
                    {/* STREAK SUMMARY */}
                    <StreakSummary streak={50} />

                    {/* MONTHLY GROWTH */}
                    <View className="mt-6 mb-4 bg-card rounded-3xl p-4 pb-2">
                      <View className="flex-row justify-between mb-2">
                        <Text className="text-lg font-semibold text-card-foreground">Monthly Growth</Text>
                        <Text className="text-primary font-medium">View details</Text>
                      </View>
                      <MonthlyGrowthChart />
                    </View>
                  </View>
              )}
            </View>
          }
          ListFooterComponent={
            <>
              <View className="h-48 p-5">
                <Text className="text-center text-muted-foreground/60">That's it for today</Text>
              </View>
            </>
          }
        />
      ) : (
        <View className="h-48 p-5">
          <Text className="text-center text-muted-foreground/60">No habits found</Text>
        </View>
      )}

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

        <AddHabitSheet habit={editHabit} loadHabits={loadHabits} open={openHabitSheet} onClose={() => {setOpenHabitSheet(false); setEditHabit(null)}} />
      </SafeAreaView>
    </>
  );
}

// import { markHabitDone } from "@/services/habit-log.service";
// import { calculateCurrentStreak } from "@/services/streak.service";
// import HabitCard from "@/components/habit/HabitCard";

// export function HabitCardd({ habit }) {
//   const streak = calculateCurrentStreak(habit.id);

//   const handleDone = () => {
//     markHabitDone(habit.id);
//     haptic.notificationSuccess();
//   };

//   return (
//     <View
//       className="p-4 rounded-xl flex-row items-center justify-between"
//       // style={{ backgroundColor: habit.bgColor }}
//     >
//       <View className="flex-row items-center gap-3">
//         <View
//           className="w-10 h-10 rounded-full items-center justify-center"
//           style={{ backgroundColor: "#fff" }}
//         >
//           <Ionicons name={habit.icon} size={20} color={habit.color} />
//         </View>

//         <View>
//           <Text className="text-base font-semibold text-foreground">
//             {habit.name}
//           </Text>

//           <Text className="text-sm text-muted-foreground">
//             🔥 {streak} day streak
//           </Text>
//         </View>
//       </View>

//       <Pressable
//         onPress={handleDone}
//         className="w-10 h-10 rounded-full bg-primary items-center justify-center"
//       >
//         <Ionicons name="checkmark" size={20} color="white" />
//       </Pressable>
//     </View>
//   );
// }