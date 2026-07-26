import { Pressable, Text, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
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

  const menuRef = React.useRef<View>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);

  const handleDone = () => {
    const targetSeconds = (habit?.duration || 0) * 60;
    updateHabitProgress(habit.id, targetSeconds || 1);
    haptic.notificationSuccess();
    loadHabits?.(); // Reload to reflect changes
  }

  const handleSkip = (reason: string) => {
    markHabitMissed(habit.id, reason);
    setShowReason(false);
    haptic.notificationSuccess();
    loadHabits?.();
  };

  const handleTimer = () => {
    if (isHabitRunning) {
      setIsHabitPaused(!isHabitPaused)
      haptic.light()
      return
    }
    startTimer(habit)
    setIsHabitPaused?.(true)
    haptic.light()
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
    { name: "Pin", icon: "pin", color: "white", action: () => { } },
    { name: "Edit", icon: "pencil", color: "white", action: () => { handleEdit() } },
    { name: "Archive", icon: "archive", color: "white", action: () => { } },
    { name: "Delete", icon: "delete", color: "#e44444", action: () => { handleDelete() } }
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
      width: Math.abs(drag.value),
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

  return (
    <>
      <ReanimatedSwipeable
        ref={swipeableRef}
        friction={2}
        enableTrackpadTwoFingerGesture
        rightThreshold={40}
        leftThreshold={40}
        renderLeftActions={LeftAction}
        renderRightActions={RightAction}
        onSwipeableOpen={(direction) => {
          if (direction === 'left') {
            handleDone();
          } else {
            setShowReason(true);
          }
          // Close the swipeable row immediately so it doesn't stay open
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
          className="p-4 px-3 my-1 rounded-3xl flex-row items-center justify-between gap-4 bg-card"
          style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
          onPress={() => router.push(`/habit/${habit.id}`)}
        >

        {/* <View className="flex-row items-center gap-4"> */}
        <View
          style={{ backgroundColor: habit.bgColor + (isDark ? '20' : '80') }}
          className="h-14 w-14 rounded-full items-center justify-center"
        >
          <Ionicons name={habit.icon as any} size={24} color={habit.color} />
        </View>

        <View className='flex-1'>
          <Text className="font-bold text-foreground">
            {habit.name}
          </Text>

          <View className="flex flex-row gap-1 items-center mt-0.5">
            <Text className="text-muted-foreground text-sm font-bold">
              🔥 {streak}
            </Text>

            <Text className="text-muted-foreground text-sm">
              day streak
            </Text>
          </View>

          {/* PROGRESS BAR */}
          {/* {(() => {
            const todayLog = getLogForHabitToday(habit.id);
            if (todayLog) {
              const target = todayLog.targetTime || (habit.duration || 0) * 60 || 1;
              const completed = todayLog.completedTime || 0;
              const progress = Math.min(1, completed / target);
              const isDone = completed >= target || todayLog.status === 'done';

              return (
                <View className="mt-2">
                  <View className="h-1 w-full bg-muted rounded-full overflow-hidden">
                    <View 
                      className={`h-full rounded-full ${isDone ? 'bg-emerald-500' : 'bg-primary'}`}
                      style={{ width: `${progress * 100}%` }}
                    />
                  </View>
                </View>
              );
            }
            return null;
          })()} */}
        </View>
        {/* </View> */}

        {/* RIGHT ACTION BUTTON */}
        {habit.duration ? (
          <AnimatedPressable
            onPress={handleTimer}
            className="h-10 w-10 rounded-full items-center justify-center bg-primary"
            hapticType="light"
          >
            <Ionicons
              name={(isHabitRunning && !isHabitPaused) ? "pause" : "play"}
              size={20}
              color="white"
            />
          </AnimatedPressable>
        ) : (
          <Pressable
            onPress={handleDone}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            className="h-10 w-10 rounded-full items-center justify-center bg-primary"
          >
            <Ionicons name="checkmark" size={20} color="white" />
          </Pressable>
        )}

        {menuOpen && (
          <Popover
            side="top"
            offset={0}
            align="center"
            visible={menuOpen}
            anchorRef={menuRef}
            onClose={() => setMenuOpen(false)}
          >
            <View className='flex-row'>
              {HabitLongPressMenus.map((menu, index) => (
                <Pressable
                  key={index}
                  onPress={menu.action}
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  className="p-2"
                >
                  <MaterialCommunityIcons name={menu.icon as any} size={24} color={menu.color} />
                </Pressable>
              ))}
            </View>
          </Popover>
        )}

      </Pressable>
      </ReanimatedSwipeable>

      <ConfirmModal
        visible={confirmDelete}
        // title="Delete Habit"
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