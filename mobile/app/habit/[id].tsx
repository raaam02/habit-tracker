import React, { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Modal } from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSharedValue, withTiming } from "react-native-reanimated";

import { calculateCurrentStreak, calculateBestStreak, completionRate } from "@/services/streak.service";
import { updateHabitProgress } from "@/services/habit-log.service";
import { haptic } from "@/utils/haptic";
import { getHabitById } from "@/db/habit.repository";
import { getLogsForHabit } from "@/db/habit-log.repository";
import { DAYS_OF_WEEK } from "@/utils/constants";
import Popover from "@/components/ui/Popover";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { deleteHabit } from "@/services/habit.service";
import AddHabitSheet from "@/components/habit/AddHabitSheet";
import { HabitInput, HabitLog } from "@/types/habit";
import AnimatedPressable from "@/components/ui/AnimatedPressable";
import ProgressRingTimer from "@/components/ui/ProgressRingTimer";

export default function HabitDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const menuRef = useRef<View>(null);
  const [habit, setHabit] = useState<HabitInput | null>(null);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalCompletions, setTotalCompletions] = useState(0);
  const [rate, setRate] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openHabitSheet, setOpenHabitSheet] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const streakProgress = useSharedValue(0);

  const isHabitCompleted = (log?: HabitLog) => {
    if (!log) return false;
    return log.status === 'done' || (log.completedTime != null && log.targetTime != null && log.completedTime >= log.targetTime);
  };

  const habitId = id.toString();
  const streak = calculateCurrentStreak(habitId);

  const handleCheckIn = () => {
    const targetSeconds = (habit?.duration || 0) * 60;
    updateHabitProgress(habitId, targetSeconds || 1);
    haptic.notificationSuccess();
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
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    if (dateStr === todayStr) return `Today, ${date.toLocaleString('default', options)}`;
    return date.toLocaleString('default', options);
  };

  useEffect(() => {
    loadHabit();
  }, [habitId]);

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
    streakProgress.value = withTiming(getWeekProgress(), { duration: 1000 });
  }, [logs, habit]);
  
  const datesOfCurrentWeek = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff + i)).toISOString().split("T")[0];
  });

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
    { id: 2, title: "Archive", icon: "archive", color: "#ffffff", action: () => {}},
    { id: 3, title: "Delete", icon: "trash", color: "#e52929", action: () => handleDelete()},
  ];

  if (!habit) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-foreground">loading...</Text>
      </View>
    );
  }

  return (
    <>
    <Stack.Screen options={{ headerShown: false }} />
    <StatusBar backgroundColor="#1a1a1a" barStyle="light-content" />
    <View className="flex-1 bg-card">
      <SafeAreaView className="flex-1">
        {/* HEADER */}
        <View className="px-2 flex-row justify-between items-center py-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-10 w-10 rounded-full items-center justify-center"
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <View className="flex flex-1 flex-row gap-4 items-center px-2">
            <View
              style={{ backgroundColor: habit.bgColor }}
              className="size-11 rounded-full items-center justify-center"
            >
              <Ionicons
                name={habit.icon as any}
                size={24}
                color={habit.color}
              />
            </View>
            <Text className="text-lg text-foreground font-semibold">
              {habit.name}
            </Text>
          </View>

          <TouchableOpacity ref={menuRef} onPress={() => { setOpenHabitSheet(false); setMenuOpen(true) }} className="h-10 w-10 rounded-full items-center justify-center">
            <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {menuOpen && (
          <Popover
            visible={menuOpen}
            anchorRef={menuRef}
            onClose={() => setMenuOpen(false)}
          >
            <View className='flex'>
              {MenuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={item.action}
                  className="flex-row items-center justify-start min-w-32 p-2 gap-2"
                >
                  <Ionicons name={item.icon as any} size={20} color={item.color} />
                  <Text className="text-foreground font-medium p-0.5" style={{ color: item.color }}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Popover>
        )}

        <ScrollView className="bg-background" showsVerticalScrollIndicator={false}>
          {/* HEADER INFO */}
          <View className="items-center px-6 mb-8 pt-4">
            <View className="bg-emerald-100 px-4 py-1.5 rounded-full mb-4">
              <Text className="text-emerald-700 font-bold text-xs uppercase tracking-wide">
                Daily Goal
              </Text>
            </View>

            {/* STREAK RING */}
            <ProgressRingTimer
              size={256}
              strokeWidth={12}
              color={habit.color}
              progress={streakProgress}
            >
              <View className="items-center justify-center bg-background h-56 w-56 rounded-full shadow-sm">
                <Ionicons name="flame" size={32} color="#10B981" />
                <Text className="text-6xl font-extrabold text-foreground">
                  {streak}
                </Text>
                <Text className="text-muted-foreground font-bold text-xs tracking-widest uppercase mt-1">
                  Day Streak
                </Text>
              </View>
            </ProgressRingTimer>
          </View>

          {/* CHECK IN BUTTON */}
          <View className="px-6 mb-10">
            <AnimatedPressable
              onPress={handleCheckIn}
              variant="primary"
              className="rounded-full flex-row items-center justify-center gap-2"
            >
              {habit.duration ? (
                  <Ionicons name="play" size={20} color="#fff" />
              ) : (
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
              )}

              <Text className="text-foreground font-bold text-base tracking-wider">
                {habit.duration ? "Start" : "Complete"}
              </Text>
            </AnimatedPressable>
          </View>

          {/* STATS */}
          <View className="px-6 mb-10">
            {/* <Text className="text-lg font-bold text-foreground mb-4">
              Progress
            </Text> */}

            <View className="flex-row justify-between gap-4">
              <View className="flex-1 bg-background p-4 rounded-3xl items-center border border-border shadow-sm">
                <Text className="text-2xl font-bold text-foreground">
                  {bestStreak}
                </Text>
                <Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider mt-1">
                  Best
                </Text>
              </View>

              <View className="flex-1 bg-background p-4 rounded-3xl items-center border border-border shadow-sm">
                <Text className="text-2xl font-bold text-foreground">{totalCompletions}</Text>
                <Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider mt-1">
                  Total
                </Text>
              </View>

              <View className="flex-1 bg-background p-4 rounded-3xl items-center border border-b-4 border-primary shadow-sm">
                <View className="flex-row items-baseline">
                  <Text className="text-2xl font-bold text-foreground">{rate}</Text>
                  <Text className="text-sm font-bold text-foreground">%</Text>
                </View>

                <Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider mt-1">
                  Rate
                </Text>
              </View>
            </View>
          </View>

          {/* CALENDAR (STATIC FOR NOW) */}
          <View className="mx-6 p-6 bg-background rounded-3xl shadow-sm border border-border mb-10">
            {/* <Text className="text-muted-foreground font-bold text-xs uppercase tracking-wider mb-2">
              Overview
            </Text> */}

            <Text className="text-xl font-bold text-foreground mb-6">
              {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
            </Text>

            <View className="flex-row justify-between mb-4">
              {DAYS_OF_WEEK.map((d, i) => (
                <Text
                  key={i}
                  className="text-muted-foreground font-bold text-xs w-8 text-center"
                >
                  {d}
                </Text>
              ))}
            </View>

            <View className="flex-row justify-between mb-2">
              {datesOfCurrentWeek.map((d, i) => {
                const dayLog = logs.find(log => log.date === d);
                const isDone = isHabitCompleted(dayLog);
                
                const target = dayLog?.targetTime || (habit.duration || 0) * 60 || 1;
                const completed = dayLog?.completedTime || 0;
                const progress = completed / target;

                const bgColor =
                  progress === 0
                    ? 'bg-muted'
                    : progress >= 1
                    ? 'bg-emerald-500'
                    : 'bg-emerald-300';

                return (
                  <View
                    key={i}
                    className={`w-8 h-8 rounded-full items-center justify-center ${bgColor}`}
                  >
                    <Text className={`text-xs font-medium ${isDone ? 'text-white' : 'text-muted-foreground'}`}>{new Date(d).getDate()}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* HISTORY */}
          <View className="bg-muted/50 rounded-t-[40px] px-6 pt-10 pb-20">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-lg font-bold text-foreground">
                History & Notes
              </Text>
              {/* <AnimatedPressable className="p-2 px-4" onPress={() => setHistoryOpen(true)}>
                <Text className="text-primary font-bold text-sm">
                  View All
                </Text>
              </AnimatedPressable> */}
            </View>

            <View className="relative border-l-2 border-muted-foreground ml-3 pl-8">
              {logs.slice(0, 3).map((item) => (
                <View key={item.id} className="relative mb-6">
                  <View
                    className={`absolute -left-[39px] top-1 h-5 w-5 rounded-full border-4 border-background ${
                      isHabitCompleted(item)
                        ? "bg-emerald-500"
                        : "bg-gray-300"
                    }`}
                  />

                  <View className="bg-background p-5 rounded-3xl shadow-sm border border-border">
                    <View className="flex-row justify-between items-center mb-3">
                      <Text className="font-bold text-foreground">
                        {formatDate(item.date)}
                      </Text>

                      <View
                        className={`px-2 py-1 rounded-md ${
                          isHabitCompleted(item)
                            ? "bg-emerald-100"
                            : "bg-gray-100"
                        }`}
                      >
                        <Text
                          className={`text-[10px] font-bold uppercase ${
                            isHabitCompleted(item)
                              ? "text-emerald-700"
                              : "text-gray-500"
                          }`}
                        >
                          {isHabitCompleted(item) ? "done" : item.status}
                        </Text>
                      </View>
                    </View>

                    {item.reason && (
                      <Text className="text-muted-foreground text-sm leading-5">
                        {item.reason}
                      </Text>
                    )}
                    {!!item.completedTime && (
                       <Text className="text-muted-foreground text-xs mt-1">
                        Completed in {Math.floor(item.completedTime / 60)}m {item.completedTime % 60}s
                       </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        <ConfirmModal
          visible={confirmDelete}
          // title="Delete Habit"
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

        {/* <Modal
          visible={historyOpen}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setHistoryOpen(false)}
        >
          <View className="flex-1 bg-background px-6 pt-4">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-foreground">
                Full History
              </Text>
              <TouchableOpacity onPress={() => setHistoryOpen(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
               <View className="relative border-l-2 border-muted-foreground ml-3 pl-8 pt-4 pb-20">
                {logs.map((item) => (
                  <View key={item.id} className="relative mb-6">
                    <View
                      className={`absolute -left-[39px] top-1 h-5 w-5 rounded-full border-4 border-background ${
                        isHabitCompleted(item)
                          ? "bg-emerald-500"
                          : "bg-gray-300"
                      }`}
                    />

                    <View className="bg-background p-5 rounded-3xl shadow-sm border border-border">
                      <View className="flex-row justify-between items-center mb-3">
                        <Text className="font-bold text-foreground">
                          {formatDate(item.date)}
                        </Text>

                        <View
                          className={`px-2 py-1 rounded-md ${
                            isHabitCompleted(item)
                              ? "bg-emerald-100"
                              : "bg-gray-100"
                          }`}
                        >
                          <Text
                            className={`text-[10px] font-bold uppercase ${
                              isHabitCompleted(item)
                                ? "text-emerald-700"
                                : "text-gray-500"
                            }`}
                          >
                            {isHabitCompleted(item) ? "done" : item.status}
                          </Text>
                        </View>
                      </View>

                      {item.reason && (
                        <Text className="text-muted-foreground text-sm leading-5">
                          {item.reason}
                        </Text>
                      )}
                      {!!item.completedTime && (
                         <Text className="text-muted-foreground text-xs mt-1">
                          Completed in {Math.floor(item.completedTime / 60)}m {item.completedTime % 60}s
                         </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </Modal> */}
      </SafeAreaView>
    </View>
    </>
  );
}
