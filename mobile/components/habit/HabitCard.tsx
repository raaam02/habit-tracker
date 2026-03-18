import { Pressable, Text, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { HabitInput } from '@/types/habit'
import { router } from 'expo-router'
import { calculateCurrentStreak } from '@/services/streak.service'
import { updateHabitProgress, getLogForHabitToday } from '@/services/habit-log.service'
import { haptic } from '@/utils/haptic'
import Popover from '../ui/Popover'
import { deleteHabit } from '@/services/habit.service'
import ConfirmModal from '../ui/ConfirmModal'
import AnimatedPressable from '../ui/AnimatedPressable'
import { useColorScheme } from 'nativewind'

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

  const menuRef = React.useRef<View>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);

  const handleDone = () => {
    const targetSeconds = (habit?.duration || 0) * 60;
    updateHabitProgress(habit.id, targetSeconds || 1);
    haptic.notificationSuccess();
    loadHabits(); // Reload to reflect changes
  }

  const handleTimer = () => {
    if (isHabitRunning) {
      setIsHabitPaused(!isHabitPaused)
      haptic.light()
      return
    }
    startTimer(habit)
    setIsHabitPaused(true)
    haptic.light()
  }

  const handleDelete = () => {
    setMenuOpen(false)
    setConfirmDelete(true)
    haptic.light()
  }

  const handleEdit = () => {
    setMenuOpen(false)
    setEditHabit(habit)
    setOpenHabitSheet(true)
    haptic.light()
  }

  const HabitLongPressMenus = [
    { name: "Pin", icon: "pin", color: "white", action: () => { } },
    { name: "Edit", icon: "pencil", color: "white", action: () => { handleEdit() } },
    { name: "Archive", icon: "archive", color: "white", action: () => { } },
    { name: "Delete", icon: "delete", color: "#e44444", action: () => { handleDelete() } }
  ]

  return (
    <>
      <TouchableOpacity
        ref={menuRef}
        onLongPress={() => {
          haptic.longPress()
          setMenuOpen(true)
        }}
        key={habit.id.toString()}
        className="p-4 px-2 rounded-2xl flex-row items-center justify-between gap-4"
        activeOpacity={0.7}
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
            variant='ghost'
            className='p-3'
          >
            <Ionicons
              name={(isHabitRunning && !isHabitPaused) ? "pause" : "play"}
              size={24}
              color="white"
            ></Ionicons>
          </AnimatedPressable>

        ) : (

          <Pressable
            onPress={handleDone}
            className="h-10 w-10 rounded-full items-center justify-center bg-primary/80"
          >
            <Ionicons name="checkmark" size={24} color="white" />
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
                <TouchableOpacity
                  key={index}
                  onPress={menu.action}
                  className="p-2"
                >
                  <MaterialCommunityIcons name={menu.icon as any} size={24} color={menu.color} />
                </TouchableOpacity>
              ))}
            </View>
          </Popover>
        )}

      </TouchableOpacity>

      <ConfirmModal
        visible={confirmDelete}
        // title="Delete Habit"
        description="Delete this habit?"
        confirmText="Delete"
        variant="destructive"
        onConfirm={() => {
          deleteHabit(habit.id)
          loadHabits()
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  )
}

export default HabitCard