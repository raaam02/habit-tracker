import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View, Text, ScrollView, Pressable, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { db } from "@/db/database";
import { getAllHabitLogs } from "@/db/habit-log.repository";
import { getHabits } from "@/db/habit.repository";
import { HabitLog, HabitInput } from "@/types/habit";
import HabitHeatmap from "@/components/habit/HabitHeatmap";
import { useColorScheme } from "nativewind";
import { router, useIsFocused } from "expo-router";
import EmptyState from "@/components/ui/EmptyState";

export default function HistoryScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const isFocused = useIsFocused();

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [allLogs, setAllLogs] = useState<HabitLog[]>([]);
  const [habits, setHabits] = useState<HabitInput[]>([]);
  const [dayDetails, setDayDetails] = useState<any[]>([]);

  const loadLogs = () => {
    try {
      const logs = getAllHabitLogs();
      setAllLogs(logs);
    } catch (e) {
      console.warn("Failed to load logs:", e);
    }
  };

  const loadHabitsData = () => {
    try {
      const data = getHabits();
      setHabits(data);
    } catch (e) {
      console.warn("Failed to load habits:", e);
    }
  };

  const loadDayDetails = () => {
    try {
      const data = db.getAllSync<any>(
        `SELECT hl.*, h.name, h.icon, h.color, h.bgColor, h.colorName, h.duration
         FROM habit_logs hl
         JOIN habits h ON hl.habitId = h.id
         WHERE hl.date = ?`,
         [selectedDate]
      );
      setDayDetails(data);
    } catch (e) {
      console.warn("Failed to load day details:", e);
    }
  };

  // Reload logs, day details, and habits when screen mounts or comes into focus
  useEffect(() => {
    if (isFocused) {
      loadLogs();
      loadDayDetails();
      loadHabitsData();
    }
  }, [isFocused, selectedDate]);

  // Format the date label beautifully (e.g. "Thursday, Oct 12")
  const formattedSelectedDate = useMemo(() => {
    const dateObj = new Date(selectedDate);
    return dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  }, [selectedDate]);

  // Generate date strings for the last 7 days (including today)
  const last7DaysStrings = useMemo(() => {
    const arr = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      arr.push(d.toISOString().split("T")[0]);
    }
    return arr;
  }, []);

  const getIsDoneOnDate = (habitId: string, dateStr: string) => {
    const log = allLogs.find(l => l.habitId === habitId && l.date === dateStr);
    if (!log) return false;
    return log.status === 'done' || (log.completedTime && log.targetTime && log.completedTime >= log.targetTime);
  };

  // Aggregated Stats
  const stats = useMemo(() => {
    try {
      const totalCompletions = allLogs.filter(
        l => l.status === 'done' || (l.completedTime && l.targetTime && l.completedTime >= l.targetTime)
      ).length;

      const totalHabits = db.getFirstSync<{ count: number }>(
        `SELECT COUNT(*) as count FROM habits`
      )?.count || 0;

      return { totalCompletions, totalHabits };
    } catch (e) {
      return { totalCompletions: 0, totalHabits: 0 };
    }
  }, [allLogs]);

  return (
    <SafeAreaView className="flex-1 bg-background text-foreground">
      <ScrollView 
        className="flex-1 px-6" 
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >

        {/* Header */}
        <View className="mt-6 mb-4">
          <Text className="text-3xl font-extrabold text-foreground">History</Text>
        </View>

        {/* Heatmap Container */}
        <HabitHeatmap
          logs={allLogs}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />

        {/* Summary stats */}
        <View className="flex-row gap-4 mt-6 mb-8">
          
          <View className="flex-1 bg-card p-4 rounded-3xl border border-border/30 flex-row items-center gap-3 shadow-sm">
            <View className="h-9 w-9 rounded-full bg-emerald-500/10 items-center justify-center">
              <Ionicons name="checkmark-done" size={18} color="#10B981" />
            </View>
            <View>
              <Text className="text-lg font-extrabold text-foreground">{stats.totalCompletions}</Text>
              <Text className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Total Done</Text>
            </View>
          </View>

          <View className="flex-1 bg-card p-4 rounded-3xl border border-border/30 flex-row items-center gap-3 shadow-sm">
            <View className="h-9 w-9 rounded-full bg-primary/10 items-center justify-center">
              <Ionicons name="sparkles" size={18} color="#6366f1" />
            </View>
            <View>
              <Text className="text-lg font-extrabold text-foreground">{stats.totalHabits}</Text>
              <Text className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Active Habits</Text>
            </View>
          </View>
          
        </View>

        {/* Inspect Day details section */}
        <View className="mb-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-extrabold text-foreground">{formattedSelectedDate}</Text>
            <View className="bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
              <Text className="text-primary font-bold text-xs">
                {dayDetails.filter(h => h.status === 'done').length} Completed
              </Text>
            </View>
          </View>

          {dayDetails.length > 0 ? (
            <View className="gap-3">
              {dayDetails.map((item) => {
                const isCompleted = item.status === "done";
                const isSkipped = item.status === "missed";
                const isInProgress = item.status === "in_progress";

                return (
                  <View
                    key={item.id}
                    className="bg-card p-4 rounded-3xl border border-border/20 flex-row items-center justify-between shadow-sm"
                  >
                    <View className="flex-row items-center gap-3 flex-1 pr-2">
                      <View
                        style={{ backgroundColor: item.bgColor + (isDark ? '20' : '50') }}
                        className="h-10 w-10 rounded-2xl items-center justify-center border border-border/10"
                      >
                        <Ionicons name={item.icon as any} size={18} color={item.color} />
                      </View>
                      <View className="flex-1">
                        <Text
                          className={`text-base font-bold text-foreground ${isCompleted ? 'line-through text-muted-foreground decoration-muted-foreground/60' : ''}`}
                        >
                          {item.name}
                        </Text>
                        {isSkipped && item.reason && (
                          <Text className="text-amber-500 text-xs font-semibold mt-0.5">
                            Skipped: {item.reason}
                          </Text>
                        )}
                        {isInProgress && item.completedTime !== undefined && (
                          <Text className="text-primary text-xs font-semibold mt-0.5">
                            In progress: {Math.round(item.completedTime / 60)}m of {item.duration}m
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Status Badge */}
                    <View>
                      {isCompleted && (
                        <View className="h-7 w-7 rounded-full bg-emerald-500 items-center justify-center">
                          <Ionicons name="checkmark" size={14} color="white" />
                        </View>
                      )}
                      {isSkipped && (
                        <View className="h-7 w-7 rounded-full bg-amber-500 items-center justify-center">
                          <Ionicons name="close" size={14} color="white" />
                        </View>
                      )}
                      {isInProgress && (
                        <View className="h-7 w-7 rounded-full bg-primary/20 items-center justify-center border border-primary/40">
                          <Ionicons name="time" size={14} color="#6366f1" />
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View className="bg-card p-6 py-8 rounded-3xl border border-border/20 items-center justify-center">
              <Ionicons name="calendar-outline" size={32} color="gray" className="opacity-40 mb-2" />
              <Text className="text-muted-foreground text-center text-sm font-medium">No activity logged for this date</Text>
            </View>
          )}
        </View>

        {/* Habit Weekly Progress Section */}
        <View className="mb-12">
          <Text className="text-lg font-extrabold text-foreground mb-4">Habit Weekly Progress</Text>
          {habits.length > 0 ? (
            <View className="gap-3">
              {habits.map((habit) => (
                <Pressable
                  key={habit.id}
                  onPress={() => router.push(`/habit/${habit.id}`)}
                  style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
                  className="bg-card p-4 rounded-3xl border border-border/20 flex-row items-center justify-between shadow-sm"
                >
                  <View className="flex-row items-center gap-3">
                    <View
                      style={{ backgroundColor: habit.bgColor + (isDark ? '20' : '50') }}
                      className="h-10 w-10 rounded-2xl items-center justify-center border border-border/10"
                    >
                      <Ionicons name={habit.icon as any} size={18} color={habit.color} />
                    </View>
                    <Text className="text-base font-bold text-foreground">{habit.name}</Text>
                  </View>

                  {/* Last 7 Days Mini Dots Grid */}
                  <View className="flex-row gap-1.5 items-center">
                    {last7DaysStrings.map((dateStr, idx) => {
                      const isDone = getIsDoneOnDate(habit.id, dateStr);
                      return (
                        <View
                          key={idx}
                          style={{
                            backgroundColor: isDone ? habit.color : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
                            borderColor: isDone ? 'transparent' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)')
                          }}
                          className="h-3 w-3 rounded-full border"
                        />
                      );
                    })}
                  </View>
                </Pressable>
              ))}
            </View>
          ) : (
            <View className="bg-card p-6 py-8 rounded-3xl border border-border/20 items-center justify-center">
              <Text className="text-muted-foreground text-center text-sm font-medium">Create habits to view progress charts</Text>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
