import React, { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, StatusBar } from "react-native";
import { Stack, useRouter, useLocalSearchParams, useIsFocused } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSharedValue, withTiming } from "react-native-reanimated";

import { calculateCurrentStreak, calculateBestStreak, completionRate } from "@/services/streak.service";
import { updateHabitProgress } from "@/services/habit-log.service";
import { haptic } from "@/utils/haptic";
import { getHabitById } from "@/db/habit.repository";
import { getLogsForHabit } from "@/db/habit-log.repository";
import Popover from "@/components/ui/Popover";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { deleteHabit } from "@/services/habit.service";
import AddHabitSheet from "@/components/habit/AddHabitSheet";
import { HabitInput, HabitLog } from "@/types/habit";
import AnimatedPressable from "@/components/ui/AnimatedPressable";
import ProgressRingTimer from "@/components/ui/ProgressRingTimer";
import StatsCard from "@/components/habit/StatsCard";
import SwipeCalendar from "@/components/swipe-calendar";

export default function HabitDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isFocused = useIsFocused();

  const menuRef = useRef<View>(null);
  const [habit, setHabit] = useState<HabitInput | null>(null);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalCompletions, setTotalCompletions] = useState(0);
  const [rate, setRate] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openHabitSheet, setOpenHabitSheet] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const streakProgress = useSharedValue(0);

  const isHabitCompleted = (log?: HabitLog) => {
    if (!log) return false;
    return log.status === 'done' || (log.completedTime != null && log.targetTime != null && log.completedTime >= log.targetTime);
  };

  const habitId = id.toString();
  const streak = calculateCurrentStreak(habitId);

  const handleCheckIn = () => {
    haptic.notificationSuccess();
    const targetSeconds = (habit?.duration || 0) * 60;
    updateHabitProgress(habitId, targetSeconds || 1);
    loadHabit();
  };

  const loadHabit = () => {
    const habitData = getHabitById(habitId);
    setHabit(habitData);
    
    const habitLogs = getLogsForHabit(habitId) as HabitLog[];
    setLogs(habitLogs);
    setBestStreak(calculateBestStreak(habitId));

    const doneCount = habitLogs.filter(isHabitCompleted).length;
    
    setTotalCompletions(doneCount);
    setRate(completionRate(habitId));
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const todayStr = new Date().toISOString().split("T")[0];
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', weekday: 'short' };
    if (dateStr === todayStr) return `Today, ${date.toLocaleString('default', { month: 'short', day: 'numeric' })}`;
    return date.toLocaleString('default', options);
  };

  useEffect(() => {
    if (isFocused) {
      loadHabit();
    }
  }, [habitId, isFocused]);

  const getWeekProgress = () => {
    const today = new Date();
    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(d.setDate(diff + i)).toISOString().split("T")[0];
    });

    let completed = 0;
    weekDates.forEach(date => {
      const log = logs.find(l => l.date === date);
      if (isHabitCompleted(log)) completed++;
    });

    return completed / 7;
  };

  useEffect(() => {
    if (logs.length > 0) {
      streakProgress.value = withTiming(getWeekProgress(), { duration: 800 });
    } else {
      streakProgress.value = withTiming(0, { duration: 800 });
    }
  }, [logs, habit]);

  const handleDelete = () => {
    setMenuOpen(false)
    setConfirmDelete(true)
    haptic.light()
  }

  const handleEdit = () => {
    setMenuOpen(false)
    setOpenHabitSheet(true)
    haptic.light()
  }

  const MenuItems = [
    { id: 1, title: "Edit", icon: "pencil", color: "#ffffff", action: () => handleEdit()},
    { id: 2, title: "Delete", icon: "trash", color: "#ef4444", action: () => handleDelete()},
  ];

  if (!habit) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-foreground">Loading details...</Text>
      </View>
    );
  }

  // Check if completed today
  const todayStr = new Date().toISOString().split("T")[0];
  const todayLog = logs.find(l => l.date === todayStr);
  const isDoneToday = isHabitCompleted(todayLog);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar backgroundColor="#000000" barStyle="light-content" />
      <View style={{ backgroundColor: "#080808" }} className="flex-1">
        
        {/* Swipe Calendar View at the top */}
        <SwipeCalendar
          accentColor={habit.color}
          backgroundColor="#080808"
          markedDates={logs.map(l => l.date)}
          selectedDate={todayStr}
          todayLabel="Today"
          onDayPress={(iso) => console.log("Day selected:", iso)}
          weekLabelConfig={{ format: "narrow" }}
        />

        <SafeAreaView className="flex-1 bg-background rounded-t-[32px] overflow-hidden">
          
          {/* HEADER NAV */}
          <View className="px-4 flex-row justify-between items-center py-4 border-b border-border/10">
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              className="h-10 w-10 rounded-full items-center justify-center bg-muted/20"
            >
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </Pressable>

            <View className="flex flex-1 flex-row gap-3 items-center px-4">
              <View
                style={{ backgroundColor: habit.bgColor }}
                className="h-10 w-10 rounded-2xl items-center justify-center border border-border/10"
              >
                <Ionicons name={habit.icon as any} size={20} color={habit.color} />
              </View>
              <Text className="text-lg text-foreground font-extrabold tracking-tight">
                {habit.name}
              </Text>
            </View>

            <Pressable 
              ref={menuRef as any} 
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              onPress={() => setMenuOpen(true)} 
              className="h-10 w-10 rounded-full items-center justify-center bg-muted/20"
            >
              <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
            </Pressable>
          </View>

          {/* Popover settings Menu */}
          {menuOpen && (
            <Popover
              visible={menuOpen}
              anchorRef={menuRef}
              onClose={() => setMenuOpen(false)}
            >
              <View className="flex bg-popover border border-border p-1.5 rounded-2xl shadow-xl min-w-36">
                {MenuItems.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={item.action}
                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                    className="flex-row items-center p-2.5 gap-2.5 rounded-lg"
                  >
                    <Ionicons name={item.icon as any} size={18} color={item.color} />
                    <Text className="text-foreground font-semibold text-sm" style={{ color: item.color }}>{item.title}</Text>
                  </Pressable>
                ))}
              </View>
            </Popover>
          )}

          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            
            {/* STREAK RING */}
            <View className="items-center px-6 mb-8 pt-8">
              <ProgressRingTimer
                size={220}
                strokeWidth={10}
                color={habit.color}
                progress={streakProgress}
              >
                <View className="items-center justify-center bg-card h-48 w-48 rounded-full border border-border/20 shadow-sm">
                  <Ionicons name="flame" size={28} color="#6366f1" />
                  <Text className="text-5xl font-extrabold text-foreground tracking-tighter mt-1">
                    {streak}
                  </Text>
                  <Text className="text-muted-foreground font-bold text-[9px] tracking-widest uppercase mt-1">
                    Day Streak
                  </Text>
                </View>
              </ProgressRingTimer>
            </View>

            {/* ADAPTIVE CTA */}
            <View className="px-6 mb-8">
              {isDoneToday ? (
                <View className="bg-emerald-500/10 border border-emerald-500/20 py-4 rounded-2xl flex-row items-center justify-center gap-2">
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  <Text className="text-emerald-500 font-bold text-base">Completed Today</Text>
                </View>
              ) : (
                <AnimatedPressable
                  onPress={handleCheckIn}
                  variant="primary"
                  className="rounded-2xl py-4 flex-row items-center justify-center gap-2 shadow-lg shadow-primary/10"
                  hapticType="light"
                >
                  <Ionicons name="checkmark" size={20} color="white" />
                  <Text className="text-primary-foreground font-bold text-base">
                    Mark Completed
                  </Text>
                </AnimatedPressable>
              )}
            </View>

            {/* SUMMARY STATS */}
            <View className="px-6 mb-8">
              <View className="flex-row justify-between gap-4">
                <StatsCard label="Best Streak" value={bestStreak} />
                <StatsCard label="Total Done" value={totalCompletions} />
                <StatsCard label="Comp. Rate" value={rate} suffix="%" variant="primary" />
              </View>
            </View>

            {/* TIMELINE LOGS */}
            <View className="bg-card rounded-t-[32px] px-6 pt-8 pb-20 border-t border-border/10">
              <Text className="text-base font-bold text-foreground mb-6 tracking-tight">
                Activity Logs
              </Text>

              {logs.length > 0 ? (
                <View className="border-l border-border/40 ml-3.5 pl-6 gap-6">
                  {logs.slice(0, 10).map((item) => {
                    const isCompleted = isHabitCompleted(item);
                    const isSkipped = item.status === "missed";
                    
                    return (
                      <View key={item.id} className="relative">
                        
                        {/* Timeline Bullet node */}
                        <View
                          style={{
                            borderColor: isCompleted ? "#10b981" : isSkipped ? "#f59e0b" : "#71717a",
                            backgroundColor: "#080808"
                          }}
                          className="absolute -left-[32px] top-1.5 h-4 w-4 rounded-full border-2 items-center justify-center"
                        >
                          <View 
                            style={{ backgroundColor: isCompleted ? "#10b981" : isSkipped ? "#f59e0b" : "#71717a" }}
                            className="h-1.5 w-1.5 rounded-full" 
                          />
                        </View>

                        {/* Log Item Content Card */}
                        <View className="bg-background/40 border border-border/20 p-4 rounded-2xl shadow-sm">
                          <View className="flex-row justify-between items-center mb-1">
                            <Text className="font-bold text-foreground text-sm">
                              {formatDate(item.date)}
                            </Text>

                            <View
                              className={`px-2 py-0.5 rounded-md border ${
                                isCompleted
                                  ? "bg-emerald-500/10 border-emerald-500/20"
                                  : "bg-amber-500/10 border-amber-500/20"
                              }`}
                            >
                              <Text
                                className={`text-[9px] font-bold uppercase ${
                                  isCompleted ? "text-emerald-500" : "text-amber-500"
                                }`}
                              >
                                {isCompleted ? "done" : "skipped"}
                              </Text>
                            </View>
                          </View>

                          {item.reason ? (
                            <Text className="text-muted-foreground text-xs mt-2 leading-relaxed font-medium">
                              "{item.reason}"
                            </Text>
                          ) : null}

                          {isCompleted && item.completedTime ? (
                            <Text className="text-muted-foreground/60 text-[10px] mt-1 flex-row items-center">
                              ⏱️ Completed in {Math.floor(item.completedTime / 60)}m {item.completedTime % 60}s
                            </Text>
                          ) : null}
                        </View>

                      </View>
                    );
                  })}
                </View>
              ) : (
                <View className="items-center justify-center py-10 bg-background/20 rounded-2xl border border-border/10">
                  <Ionicons name="layers-outline" size={28} color="gray" className="opacity-40 mb-2" />
                  <Text className="text-muted-foreground text-xs font-semibold">No activity logs recorded yet</Text>
                </View>
              )}
            </View>

          </ScrollView>

          <ConfirmModal
            visible={confirmDelete}
            description="Delete this habit?"
            confirmText="Delete"
            variant="destructive"
            onConfirm={() => {
              deleteHabit(habitId)
              router.back()
            }}
            onCancel={() => setConfirmDelete(false)}
          />

          <AddHabitSheet habit={habit} loadHabits={loadHabit} open={openHabitSheet} onClose={() => setOpenHabitSheet(false)} />
        </SafeAreaView>
      </View>
    </>
  );
}
