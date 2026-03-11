import { Pressable, Text, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { HabitInput } from '@/types/habit'
import { router } from 'expo-router'
import { calculateCurrentStreak } from '@/services/streak.service'
import { markHabitDone } from '@/services/habit-log.service'
import { haptic } from '@/utils/haptic'
import Popover from '../ui/Popover'
import { deleteHabit } from '@/services/habit.service'
import ConfirmModal from '../ui/ConfirmModal'

interface HabitCardProps {
  habit: HabitInput
  loadHabits: () => void
}

function HabitCard({ habit, loadHabits }: HabitCardProps) {

  const streak = calculateCurrentStreak(habit.id)
  const [running, setRunning] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const menuRef = React.useRef<View>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);

  const handleDone = () => {
    markHabitDone(habit.id)
    haptic.notificationSuccess()
  }

  const handleTimer = () => {
    setRunning(!running)
    haptic.light()
  }

  const handleDelete = () => {
    setMenuOpen(false)
    setConfirmDelete(true)
    haptic.light()
  }

  const HabitLongPressMenus = [
    { name: "Pin", icon: "pin", color: "white", action: () => { } },
    { name: "Edit", icon: "pencil", color: "white", action: () => { } },
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
        className="p-4 rounded-2xl flex-row items-center justify-between"
        activeOpacity={0.7}
        onPress={() => router.push(`/habit/${habit.id}`)}
      >

        <View className="flex-row items-center gap-4">
          <View
            style={{ backgroundColor: habit.bgColor }}
            className="h-10 w-10 rounded-full items-center justify-center"
          >
            <Ionicons name={habit.icon as any} size={24} color={habit.color} />
          </View>

          <View>
            <Text className="font-bold text-foreground">
              {habit.name}
            </Text>

            <View className="flex flex-row gap-1 items-center">
              <Text className="text-muted-foreground text-sm font-bold">
                🔥 {streak}
              </Text>

              <Text className="text-muted-foreground text-sm">
                day streak
              </Text>
            </View>
          </View>
        </View>

        {/* RIGHT ACTION BUTTON */}
        {habit.duration ? (

          <Pressable
            onPress={handleTimer}
            className="h-10 w-10 rounded-full items-center justify-center bg-muted"
          >
            <Ionicons
              name={running ? "pause" : "play"}
              size={20}
              color="white"
            />
          </Pressable>

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