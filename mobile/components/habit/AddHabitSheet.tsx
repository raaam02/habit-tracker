import { View, Text, TextInput, Pressable, Platform } from "react-native";
import React, { useEffect, useState } from "react";
import { BottomSheetTextInput, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

import BottomSheet from "../ui/BottomSheet";
import TimePicker from "../ui/TimePicker";
import DatePicker from "../ui/DatePicker";
import SegmentedControl from "../ui/SegmentControl";

import { haptic } from "@/utils/haptic";
import { ScrollView } from "react-native-gesture-handler";
import { createHabit, updateHabit } from "@/services/habit.service";
import { shakeAnimation } from "@/utils/animation";
import { Ionicons } from "@expo/vector-icons";
import IconPicker from "../IconPicker";
import { COLORS, DAYS_OF_WEEK, FREQUENCY_OPTIONS } from "@/utils/constants";
import { HabitInput } from "@/types/habit";
import AnimatedPressable from "../ui/AnimatedPressable";

function AddHabitSheet({
  habit,
  loadHabits,
  open,
  onClose,
}: {
  habit?: HabitInput | null,
  loadHabits: () => void
  open: boolean;
  onClose: () => void;
}) {
  const [isEdit, setIsEdit] = useState(false);

  const [habitName, setHabitName] = useState("");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [reminderTime, setReminderTime] = useState<Date>(new Date());

  const [duration, setDuration] = useState("10");
  const [habitType, setHabitType] = useState(0); // 0 = Task-based, 1 = Time-based

  const [frequency, setFrequency] = useState(0);
  const [days, setDays] = useState<number[]>([]);

  const [reminderEnabled, setReminderEnabled] = useState(true);

  const [icon, setIcon] = useState("book");
  const [color, setColor] = useState(COLORS[2]);

  const [error, setError] = useState("");
  const [showIconPicker, setShowIconPicker] = useState(false);

  const shake = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));

  // Reset form when sheet closes
  useEffect(() => {
    if (!open) {
      setIsEdit(false);
      setHabitName("");
      setDuration("10");
      setHabitType(0);
      setFrequency(0);
      setDays([]);
      setReminderEnabled(true);
      setStartDate(new Date());
      setReminderTime(new Date());
      setShowIconPicker(false);
      setError("");
    }

    if (habit) {
      setIsEdit(true);
      setHabitName(habit.name);
      setDuration(habit.duration?.toString() || "10");
      setHabitType(habit.duration && habit.duration > 0 ? 1 : 0);
      setFrequency(habit.frequency);
      setDays(habit.days);
      setReminderEnabled(habit.reminderEnabled);
      setStartDate(new Date(habit.startDate));
      setReminderTime(new Date(habit.reminderTime));
      setIcon(habit.icon);
      setColor({
        name: habit.colorName,
        color: habit.color,
        bgColor: habit.bgColor,
      });
    }
  }, [open, habit]);

  const submitHabit = () => {
    if (!habitName.trim()) {
      setError("Habit name is required");
      haptic.notificationError();
      shake.value = shakeAnimation(6);
      return;
    }

    if (habitName.length > 40) {
      setError("Habit name cannot exceed 40 characters");
      haptic.notificationError();
      shake.value = shakeAnimation(6);
      return;
    }

    if (isEdit && habit) {
      updateHabit({
        id: habit.id,
        name: habitName.trim(),
        icon: icon,
        colorName: color.name,
        color: color.color,
        bgColor: color.bgColor,
        startDate: startDate.toISOString(),
        reminderTime: reminderTime.toISOString(),
        duration: habitType === 1 ? Number(duration) : 0,
        frequency,
        days,
        reminderEnabled,
      });
    } else {
      createHabit({
        name: habitName.trim(),
        icon: icon,
        colorName: color.name,
        color: color.color,
        bgColor: color.bgColor,
        startDate: startDate.toISOString(),
        reminderTime: reminderTime.toISOString(),
        duration: habitType === 1 ? Number(duration) : 0,
        frequency,
        days,
        reminderEnabled,
      });
    }

    loadHabits();
    onClose();
  };

  return (
    <>
      <BottomSheet open={open} onClose={onClose}>
        {{
          content: (
            <BottomSheetScrollView
              contentContainerStyle={{ paddingBottom: 120, gap: 24, paddingTop: 16 }}
              className="flex-1 px-6"
              showsVerticalScrollIndicator={false}
            >
              {/* Form Section: Details */}
              <View className="gap-5">

                {/* Icon Selection preview */}
                <View className="items-center mt-2">
                  <Pressable
                    className="w-20 h-20 rounded-full items-center justify-center border border-dashed"
                    style={{
                      backgroundColor: color.bgColor,
                    }}
                    onPress={() => {
                      haptic.light();
                      setShowIconPicker(true);
                    }}
                  >
                    <Ionicons name={icon as any} size={28} color={color.color} />
                    <View className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-primary items-center justify-center shadow-md">
                      <Ionicons name="pencil" size={12} color="white" />
                    </View>
                  </Pressable>
                </View>

                {/* Habit Name Input */}
                <View>
                  <Animated.View style={animatedStyle}>
                    <BottomSheetTextInput
                      placeholder="e.g., Read books"
                      placeholderTextColor="gray"
                      className="rounded-2xl text-foreground text-base"
                      value={habitName}
                      maxLength={40}
                      onChangeText={(text) => {
                        setHabitName(text);
                        if (error) setError("");
                      }}
                    />
                  </Animated.View>
                </View>

                {/* Habit Type Selection */}
                <View>
                  <SegmentedControl
                    options={[
                      { label: "Check-in", icon: "checkmark-circle-outline" },
                      { label: "Timer", icon: "time-outline" }
                    ]}
                    valueIndex={habitType}
                    onChange={setHabitType}
                  />
                </View>

              </View>

              {/* Form Section: Schedule */}
              <View className="gap-5">

                {/* Frequency selection */}
                <View>
                  <SegmentedControl
                    options={FREQUENCY_OPTIONS}
                    valueIndex={frequency}
                    onChange={setFrequency}
                  />
                </View>

                {/* Days of week */}
                {frequency === 1 && (
                  <View>
                    <Text className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-2 ml-1">
                      Days of week
                    </Text>
                    <View className="flex-row gap-2 justify-between">
                      {DAYS_OF_WEEK.map((day, index) => {
                        const selected = days.includes(index);
                        return (
                          <Pressable
                            key={index}
                            onPress={() => {
                              if (selected) {
                                setDays(days.filter((d) => d !== index));
                              } else {
                                setDays([...days, index]);
                              }
                              haptic.light();
                            }}
                            className={`w-10 h-10 rounded-full items-center justify-center border ${
                              selected ? "bg-primary border-primary" : "bg-card border-border/40"
                            }`}
                          >
                            <Text
                              className={`text-xs font-semibold ${
                                selected ? "text-primary-foreground font-bold" : "text-muted-foreground"
                              }`}
                            >
                              {day.substring(0, 1)}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Monthly/Yearly Calendar selection */}
                {(frequency === 2 || frequency === 3) && (
                  <View>
                    <Text className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-2 ml-1">
                      Start Date
                    </Text>
                    <DatePicker value={startDate} onChange={setStartDate} />
                  </View>
                )}

                {/* Duration and Time selectors row */}
                <View className="flex-row justify-between items-center gap-4 mt-2">

                  {/* Goal duration (if Time-based) */}
                  {habitType === 1 ? (
                    <View className="flex-1">
                      <Text className="text-muted-foreground text-sm tracking-widest mb-1.5 ml-1">
                        Duration
                      </Text>
                      <View className="flex-row items-center gap-2">
                        <TextInput
                          keyboardType="numeric"
                          placeholder="10"
                          placeholderTextColor="gray"
                          className="px-4 py-3 border border-border rounded-2xl text-foreground bg-card text-center w-24 text-base"
                          value={duration}
                          maxLength={4}
                          onChangeText={(text) => {
                            const val = parseInt(text || "0");
                            if (val > 1080) {
                              setDuration("1080");
                            } else {
                              setDuration(text.replace(/[^0-9]/g, ""));
                            }
                          }}
                        />
                        <Text className="text-muted-foreground text-sm">mins</Text>
                      </View>
                    </View>
                  ) : (
                    <View className="flex-1" />
                  )}

                  {/* Reminder Time */}
                  <View className="items-end">
                    <Text className="text-muted-foreground text-sm tracking-widest mb-1.5 mr-1">
                      Reminder
                    </Text>
                    <TimePicker value={reminderTime} onChange={setReminderTime} />
                  </View>

                </View>

              </View>
            </BottomSheetScrollView>
          ),
          footer: (
            <View className="px-6 pb-8 bg-background border-t border-border/10 pt-4">
              <AnimatedPressable
                onPress={submitHabit}
                variant="primary"
                className="py-4 rounded-2xl items-center"
                hapticType="light"
              >
                <Text className="text-primary-foreground text-base font-bold">
                  {isEdit ? "Save Changes" : "Create Habit"}
                </Text>
              </AnimatedPressable>
            </View>
          )
        }}
      </BottomSheet>

      {/* Nested BottomSheet for Icon Picker */}
      <BottomSheet open={showIconPicker} onClose={() => setShowIconPicker(false)}>
        {{
          content: (
            <ScrollView
              className="px-6 py-4 flex-grow-0"
              contentContainerStyle={{ paddingBottom: 60 }}
              showsVerticalScrollIndicator={false}
            >
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-bold text-foreground">Customize Icon</Text>
                <Pressable onPress={() => setShowIconPicker(false)} className="p-2 -mr-2">
                  <Ionicons name="checkmark-circle" size={28} color="#6366f1" />
                </Pressable>
              </View>
              <IconPicker
                onSelectIcon={setIcon}
                onSelectColor={setColor}
                color={color}
                icon={icon}
              />
            </ScrollView>
          )
        }}
      </BottomSheet>
    </>
  );
}

export default AddHabitSheet;
