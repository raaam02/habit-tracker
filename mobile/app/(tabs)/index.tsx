import { View, Text, ScrollView, Pressable, FlatList } from "react-native";
import React, { useEffect, useState, useCallback } from "react";
import AddHabitSheet from "@/components/habit/AddHabitSheet";
import { SafeAreaView } from "react-native-safe-area-context";
import { Habit, HabitInput, HabitLog } from "@/types/habit";
import Habits from "@/components/habit/Habits";
import StreakSummary from "@/components/StreakSummary";
import WelcomeHeader from "@/components/WelcomeHeader";
import { MOCK_HABITS, MOCK_USER } from "@/utils/mock.data";
import { Ionicons } from "@expo/vector-icons";
import { getHabits } from "@/db/habit.repository";
import { getAllHabitLogs } from "@/db/habit-log.repository";
import { getUserProfile } from "@/db/user.repository";
import { haptic } from "@/utils/haptic";
import HabitCard from "@/components/habit/HabitCard";
import RunningHabitTimer from "@/components/habit/RunningHabitTimer";
import { updateHabitProgress, getLogForHabitToday } from "@/services/habit-log.service";
import AnimatedPressable from "@/components/ui/AnimatedPressable";
import HabitHeatmap from "@/components/habit/HabitHeatmap";
import { router, useIsFocused } from "expo-router";

export default function HomeScreen() {
  const [openHabitSheet, setOpenHabitSheet] = useState(false);
  const [habits, setHabits] = useState<HabitInput[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [editHabit, setEditHabit] = useState<HabitInput | null>(null);
  const [runningHabit, setRunningHabit] = useState<HabitInput | null>(null);
  const [isHabitPaused, setIsHabitPaused] = useState(false);
  const [initialTimerTime, setInitialTimerTime] = useState(0);
  const [user, setUser] = useState<any>(MOCK_USER);

  const isFocused = useIsFocused();

  // A ref to keep track of the current seconds exactly as they are in the timer,
  // so if we preempt the timer with another habit, we can save progress.
  const currentSecondsRef = React.useRef<number>(0);

  const loadHabits = () => {
    const data = getHabits()
    setHabits(data)
    try {
      const allLogs = getAllHabitLogs();
      setLogs(allLogs);
    } catch (e) {
      console.warn(e);
    }
    const profile = getUserProfile();
    if (profile) {
      setUser(profile);
    }
  }

  useEffect(() => {
    if (isFocused) {
      const profile = getUserProfile();
      if (!profile || !profile.onboardingCompleted) {
        router.replace("/onboarding");
      } else {
        loadHabits();
      }
    }
  }, [isFocused]);


  return (
    <>
    <SafeAreaView className="flex-1 bg-background text-foreground">
      <WelcomeHeader user={user} />
      {habits.length > 0 ? (
        <FlatList
          data={habits}
          keyExtractor={(item) => item.id.toString()}
          className="px-4 rounded-xl"
          renderItem={({ item }) =>
            <HabitCard
              habit={item}
              isHabitRunning={runningHabit?.id === item.id}
              isHabitPaused={isHabitPaused}
              setIsHabitPaused={setIsHabitPaused}
              loadHabits={loadHabits}
              startTimer={(habit) => {
                // If a habit was already running and we are switching to another,
                // securely auto-save the tracked progress before switching.
                if (runningHabit && habit?.id !== runningHabit.id) {
                  updateHabitProgress(runningHabit.id, currentSecondsRef.current);
                }

                if (habit) {
                  const todayLog = getLogForHabitToday(habit.id);
                  setInitialTimerTime(todayLog?.completedTime || 0);
                  currentSecondsRef.current = todayLog?.completedTime || 0;
                } else {
                  setInitialTimerTime(0);
                  currentSecondsRef.current = 0;
                }
                setRunningHabit(habit);
              }}
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
                  initialTime={initialTimerTime}
                  onStop={(completedTime) => {
                    updateHabitProgress(runningHabit.id, completedTime || 0);
                    haptic.notificationSuccess();
                    setRunningHabit(null);
                    setIsHabitPaused(false);
                    currentSecondsRef.current = 0;
                    loadHabits();
                  }}
                  onProgressChange={(secs) => {
                    currentSecondsRef.current = secs;
                  }}
                  paused={isHabitPaused}
                  setPaused={(paused) => {
                    // Auto-save when paused manually
                    if (paused) {
                      updateHabitProgress(runningHabit.id, currentSecondsRef.current);
                    }
                    setIsHabitPaused(paused);
                  }}
                />
              ) : (
                  <View>
                    {/* STREAK SUMMARY */}
                    <StreakSummary streak={50} />

                    {/* HEATMAP */}
                    <HabitHeatmap logs={logs} />
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
        <View className="flex-1 justify-center items-center px-8 py-16 mt-8">
          <View className="bg-primary/10 p-6 rounded-full mb-4">
            <Ionicons name="sparkles-outline" size={40} color="#6366f1" />
          </View>
          <Text className="text-lg font-bold text-foreground text-center mb-1">No habits tracked yet</Text>
          <Text className="text-muted-foreground text-center text-sm leading-5 max-w-[280px]">
            Tap the "+" button below to build your routine and start tracking your daily streaks.
          </Text>
        </View>
      )}

        {/* FLOATING ADD BUTTON */}
        <View className="absolute bottom-28 right-5">
          <AnimatedPressable
            onPress={() => {
              setOpenHabitSheet(true)
              haptic.light()
            }}
            variant="primary"
          >
            <Ionicons name="add" size={24} color="white" />
          </AnimatedPressable>
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
