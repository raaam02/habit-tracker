import { View, Text, ScrollView, Pressable, FlatList, Platform } from "react-native";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import AddHabitSheet from "@/components/habit/AddHabitSheet";
import { SafeAreaView } from "react-native-safe-area-context";
import { Habit, HabitInput, HabitLog } from "@/types/habit";
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
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonCard, SkeletonGrid, SkeletonProfile } from "@/components/ui/SkeletonLoader";

export default function HomeScreen() {
  const [openHabitSheet, setOpenHabitSheet] = useState(false);
  const [habits, setHabits] = useState<HabitInput[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [editHabit, setEditHabit] = useState<HabitInput | null>(null);
  const [runningHabit, setRunningHabit] = useState<HabitInput | null>(null);
  const [isHabitPaused, setIsHabitPaused] = useState(false);
  const [initialTimerTime, setInitialTimerTime] = useState(0);
  const [user, setUser] = useState<any>(MOCK_USER);
  const [loading, setLoading] = useState(true);

  const isFocused = useIsFocused();
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
      setLoading(true);
      const profile = getUserProfile();
      if (!profile || !profile.onboardingCompleted) {
        router.replace("/onboarding");
      } else {
        loadHabits();
        const timer = setTimeout(() => {
          setLoading(false);
        }, 400);
        return () => clearTimeout(timer);
      }
    }
  }, [isFocused]);

  const completedCount = useMemo(() => {
    return habits.filter(h => {
      const log = getLogForHabitToday(h.id);
      return log?.status === 'done' || (log?.completedTime && log?.targetTime && log.completedTime >= log.targetTime);
    }).length;
  }, [habits]);

  const totalCount = habits.length;

  return (
    <>
      <SafeAreaView className="flex-1 bg-background text-foreground">

        {loading ? (
          <ScrollView className="px-6 py-4" showsVerticalScrollIndicator={false}>
            <SkeletonProfile />
            <SkeletonGrid />
            <View className="mt-8 gap-2">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </View>
          </ScrollView>
        ) : (
          <FlatList
            data={habits}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 130 }}
            renderItem={({ item }) =>
              <HabitCard
                habit={item}
                isHabitRunning={runningHabit?.id === item.id}
                isHabitPaused={isHabitPaused}
                setIsHabitPaused={setIsHabitPaused}
                loadHabits={loadHabits}
                startTimer={(habit) => {
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
              <View className="mb-4">
                <WelcomeHeader user={user} completedCount={completedCount} totalCount={totalCount} />

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
                      if (paused) {
                        updateHabitProgress(runningHabit.id, currentSecondsRef.current);
                      }
                      setIsHabitPaused(paused);
                    }}
                  />
                ) : (
                  <View>
                    {/*<StreakSummary streak={habits.length > 0 ? 5 : 0} />*/}
                    {/*<HabitHeatmap logs={logs} />*/}
                  </View>
                )}
              </View>
            }
            ListEmptyComponent={
              <EmptyState
                icon="sparkles-outline"
                title="Your journey starts here"
                description="Create your first habit to start tracking daily routines and building consistency streaks."
                ctaText="Create Habit"
                onCtaPress={() => {
                  setOpenHabitSheet(true);
                }}
              />
            }
          />
        )}

        {/* Floating Add Action */}
        {!loading && (
          <View className="absolute bottom-24 right-6 z-50">
            <AnimatedPressable
              onPress={() => {
                setOpenHabitSheet(true)
                haptic.light()
              }}
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                shadowColor: "#6366f1",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.35,
                shadowRadius: 12,
                elevation: 4,
              }}
              className="bg-primary justify-center items-center"
              hapticType="light"
            >
              <Ionicons name="add" size={28} color="white" />
            </AnimatedPressable>
          </View>
        )}

        <AddHabitSheet
          habit={editHabit}
          loadHabits={loadHabits}
          open={openHabitSheet}
          onClose={() => {
            setOpenHabitSheet(false);
            setEditHabit(null);
          }}
        />
      </SafeAreaView>
    </>
  );
}
