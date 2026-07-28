import { Pressable, Text, View } from 'react-native'
import React, { useState, useEffect } from 'react'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { HabitInput } from '@/types/habit'
import { router } from 'expo-router'
import { calculateCurrentStreak } from '@/services/streak.service'
import { updateHabitProgress, getLogForHabitToday, markHabitMissed } from '@/services/habit-log.service'
import { haptic } from '@/utils/haptic'
import Popover from '../ui/Popover'
import { deleteHabit } from '@/services/habit.service'
import ConfirmModal from '../ui/ConfirmModal'
import ReasonModal from '../ui/ReasonModal'
import AnimatedPressable from '../ui/AnimatedPressable'
import { useColorScheme } from 'nativewind'
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { useAnimatedStyle, SharedValue } from 'react-native-reanimated';

interface HabitCardProps {
  habit: HabitInput,
  loadHabits: () => void,
  setEditHabit: (habit: HabitInput) => void,
  setOpenHabitSheet: (open: boolean) => void,
  startTimer: (habit: HabitInput | null) => void,
  isHabitRunning: boolean,
  isHabitPaused: boolean,
  setIsHabitPaused: (paused: boolean) => void
}

function HabitCard({ habit, loadHabits, setEditHabit, setOpenHabitSheet, startTimer, isHabitRunning, isHabitPaused, setIsHabitPaused }: HabitCardProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const streak = calculateCurrentStreak(habit.id)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showReason, setShowReason] = useState(false)
  const [todayLog, setTodayLog] = useState<any>(null)

  const menuRef = React.useRef<View>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);

  // Load today's log state on mount / update
  useEffect(() => {
    try {
      const log = getLogForHabitToday(habit.id);
      setTodayLog(log);
    } catch (e) {
      console.warn("Failed to get today's log in HabitCard:", e);
    }
  }, [habit.id]);

  const handleDone = () => {
    haptic.notificationSuccess();
    const targetSeconds = (habit?.duration || 0) * 60;
    updateHabitProgress(habit.id, targetSeconds || 1);
    // Reload logs
    const log = getLogForHabitToday(habit.id);
    setTodayLog(log);
    loadHabits?.(); // Reload parent
  }

  const handleSkip = (reason: string) => {
    haptic.notificationSuccess();
    markHabitMissed(habit.id, reason);
    const log = getLogForHabitToday(habit.id);
    setTodayLog(log);
    setShowReason(false);
    loadHabits?.();
  };

  const handleTimer = () => {
    haptic.light();
    if (isHabitRunning) {
      setIsHabitPaused(!isHabitPaused)
      return
    }
    startTimer(habit)
    setIsHabitPaused?.(true)
  }

  const handleDelete = () => {
    setMenuOpen(false)
    setConfirmDelete(true)
    haptic.light()
  }

  const handleEdit = () => {
    setMenuOpen(false)
    setEditHabit?.(habit)
    setOpenHabitSheet?.(true)
    haptic.light()
  }

  const HabitLongPressMenus = [
    { name: "Edit", icon: "pencil", color: "white", action: () => { handleEdit() } },
    { name: "Delete", icon: "delete", color: "#ef4444", action: () => { handleDelete() } }
  ]

  const LeftAction = (prog: SharedValue<number>, drag: SharedValue<number>) => {
    const style = useAnimatedStyle(() => ({
      width: drag.value,
    }));
    const iconStyle = useAnimatedStyle(() => ({
      transform: [{ scale: prog.value }],
      opacity: prog.value,
    }));
    return (
      <Animated.View style={[style]} className="bg-emerald-500 my-1 justify-center rounded-3xl">
        <Animated.View style={iconStyle} className="flex-row items-center justify-end pr-8 w-full">
          <Ionicons name="checkmark" size={28} color="white" />
        </Animated.View>
      </Animated.View>
    );
  };

  const RightAction = (prog: SharedValue<number>, drag: SharedValue<number>) => {
    const style = useAnimatedStyle(() => ({
      width: drag.value,
    }));
    const iconStyle = useAnimatedStyle(() => ({
      transform: [{ scale: prog.value }],
      opacity: prog.value,
    }));
    return (
      <View className="flex-row justify-end w-full">
        <Animated.View style={[style]} className="bg-amber-500 my-1 justify-center rounded-3xl">
          <Animated.View style={iconStyle} className="flex-row items-center justify-start pl-8 w-full">
            <Text className='text-white font-bold text-lg'>Skip</Text>
          </Animated.View>
        </Animated.View>
      </View>
    );
  };

  const swipeableRef = React.useRef<any>(null);

  // Status mapping
  const isDone = todayLog?.status === "done" || (todayLog?.completedTime && todayLog?.targetTime && todayLog.completedTime >= todayLog.targetTime);
  const isSkipped = todayLog?.status === "skipped";

  // Calculate progress percent
  const progressPercent = (() => {
    if (!todayLog) return 0;
    const target = todayLog.targetTime || (habit.duration || 0) * 60 || 1;
    const completed = todayLog.completedTime || 0;
    return Math.min(100, Math.floor((completed / target) * 100));
  })();

  return (
    <>
      <ReanimatedSwipeable
        ref={swipeableRef}
        friction={1.5}
        enableTrackpadTwoFingerGesture
        rightThreshold={50}
        leftThreshold={50}
        renderLeftActions={LeftAction}
        renderRightActions={RightAction}
        onSwipeableOpen={(direction) => {
          if (direction === 'left') {
            handleDone();
          } else {
            setShowReason(true);
          }
          swipeableRef.current?.close();
          haptic.light();
        }}
      >
        <Pressable
          ref={menuRef as any}
          onLongPress={() => {
            haptic.longPress()
            setMenuOpen(true)
          }}
          key={habit.id.toString()}
          className="p-4 px-4 my-1 rounded-3xl flex-row items-center justify-between gap-4 bg-card border border-border/20 shadow-sm"
          style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
          onPress={() => router.push(`/habit/${habit.id}`)}
        >
          {/* Left Icon (Colored circular background with solid icon symbol) */}
          <View
            style={{ backgroundColor: habit.bgColor + (isDark ? '20' : '50') }}
            className="h-12 w-12 rounded-2xl items-center justify-center border border-border/10"
          >
            <Ionicons name={habit.icon as any} size={22} color={habit.color} />
          </View>

          {/* Center Details */}
          <View className='flex-1 justify-center'>
            <Text className={`font-bold text-foreground text-base ${isDone ? "line-through text-muted-foreground/70" : ""}`}>
              {habit.name}
            </Text>

            {/* Streak & Info (Flame colors match habit themes perfectly!) */}
            <View className="flex-row items-center gap-2 mt-0.5">

              {isHabitRunning ? (
                <View className="flex-row items-center gap-1">
                  <Ionicons name="time" size={14} color="#f59e0b" />
                  <Text className="text-amber-500 text-xs font-bold">
                    Running...
                  </Text>
                </View>
              ) : (
                <View className="flex-row items-center gap-1">
                  <Ionicons name="flame" size={14} color={habit.color} />
                  <Text style={{ color: habit.color }} className="text-xs font-bold">
                    {streak} {streak === 1 ? 'day' : 'days'}
                  </Text>
                </View>
              )}

              {/*{habit.reminderEnabled && habit.reminderTime ? (
                <>
                  <Text className="text-muted-foreground/30 text-xs">•</Text>
                  <Text className="text-muted-foreground text-xs flex-row items-center">
                    ⏰ {habit.reminderTime}
                  </Text>
                </>
              ) : null}*/}
            </View>

            {/* PROGRESS BAR */}
            {todayLog && progressPercent > 0 && !isDone && (
              <View className="mt-2 w-[85%]">
                <View className="h-[3px] w-full bg-muted/30 rounded-full overflow-hidden">
                  <View
                    style={{ width: `${progressPercent}%`, backgroundColor: habit.color }}
                    className="h-full rounded-full"
                  />
                </View>
              </View>
            )}
          </View>

          {/* Right Action Button (Matches mockup checkmark circles exactly) */}
          <View className="h-9 items-center justify-center">
            {isDone ? (
              // Solid circle colored to match habit theme, with white checkmark
              <AnimatedPressable
                onPress={handleDone}
                style={{ backgroundColor: habit.color }}
                className="h-8 w-8 rounded-full items-center justify-center"
              >
                <Ionicons name="checkmark" size={20} color="white" />
              </AnimatedPressable>
            ) : isSkipped ? (
              // Skipped indicator
              <View className="h-6 w-6 rounded-full bg-zinc-500/10 border border-zinc-500/20 items-center justify-center">
                <Ionicons name="close" size={12} color="gray" />
              </View>
            ) : isHabitRunning ? (
              // Ticking state: filled color circle with pause icon
              <AnimatedPressable
                onPress={handleTimer}
                className="h-6 w-6 rounded-full items-center justify-center "
                hapticType="light"
              >
                <Ionicons name="pause" size={20} color="white" />
              </AnimatedPressable>
            ) : habit.duration ? (
              // Timer habit: hollow circle containing play icon
              <AnimatedPressable
                onPress={handleTimer}
                style={{ borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)" }}
                className="h-6 w-6 rounded-full items-center justify-center"
                hapticType="light"
              >
                <Ionicons name="play" size={20} color={habit.color} style={{ marginLeft: 1 }} />
              </AnimatedPressable>
            ) : (
              // Check-in habit: hollow circle
              <AnimatedPressable
                onPress={handleDone}
                style={{ borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)" }}
                className="h-6 w-6 rounded-full border-2"
                hapticType="light"
              />
            )}
          </View>

          {menuOpen && (
            <Popover
              side="top"
              offset={0}
              align="center"
              visible={menuOpen}
              anchorRef={menuRef}
              onClose={() => setMenuOpen(false)}
            >
              <View className='flex-row bg-popover border border-border p-1 rounded-xl shadow-lg'>
                {HabitLongPressMenus.map((menu, index) => (
                  <Pressable
                    key={index}
                    onPress={menu.action}
                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                    className="p-2 px-3 rounded-lg"
                  >
                    <MaterialCommunityIcons name={menu.icon as any} size={20} color={menu.color} />
                  </Pressable>
                ))}
              </View>
            </Popover>
          )}
        </Pressable>
      </ReanimatedSwipeable>

      <ConfirmModal
        visible={confirmDelete}
        description="Delete this habit?"
        confirmText="Delete"
        variant="destructive"
        onConfirm={() => {
          deleteHabit(habit.id)
          loadHabits?.()
        }}
        onCancel={() => setConfirmDelete(false)}
      />

      <ReasonModal
        visible={showReason}
        onConfirm={handleSkip}
        onCancel={() => setShowReason(false)}
      />
    </>
  )
}

export default HabitCard
