import { View, Text, TextInput, Pressable, Switch } from "react-native";
import React, { useEffect, useState } from "react";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import BottomSheet from "../ui/BottomSheet";
import Button from "../ui/Button";
import TimePicker from "../ui/TimePicker";
import DatePicker from "../ui/DatePicker";
import SegmentedControl from "../ui/SegmentControl";

import { haptic } from "@/utils/haptic";
import { ScrollView } from "react-native-gesture-handler";
import { createHabit } from "@/services/habit.service";

const DAYS_OF_WEEK = ["S", "M", "T", "W", "T", "F", "S"];
const FREQUENCY_OPTIONS = ["Daily", "Weekly", "Monthly", "Yearly"];

function AddHabitSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [habitName, setHabitName] = useState("");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [reminderTime, setReminderTime] = useState<Date>(new Date());

  const [duration, setDuration] = useState("10");

  const [frequency, setFrequency] = useState(0);
  const [days, setDays] = useState<number[]>([]);

  const [reminderEnabled, setReminderEnabled] = useState(true);

  const [error, setError] = useState("");

  const shake = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));

  // Reset form when sheet closes
  useEffect(() => {
    if (!open) {
      setHabitName("");
      setDuration("10");
      setFrequency(0);
      setDays([]);
      setReminderEnabled(true);
      setStartDate(new Date());
      setReminderTime(new Date());
      setError("");
    }
  }, [open]);

  const submitHabit = () => {
    if (!habitName.trim()) {
      setError("Habit name is required");
      haptic.notificationError();

      shake.value = withSequence(
        withTiming(-6, { duration: 40 }),
        withTiming(6, { duration: 40 }),
        withTiming(-6, { duration: 40 }),
        withTiming(6, { duration: 40 }),
        withTiming(0, { duration: 40 })
      );

      return;
    }

    const habit = createHabit({
      name: habitName.trim(),
      startDate: startDate.toISOString(),
      reminderTime: reminderTime.toISOString(),
      duration: Number(duration),
      frequency,
      days,
      reminderEnabled,
    });

    console.log("New Habit:", habit);

    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose}>
      <ScrollView showsVerticalScrollIndicator={false}>
      <View className="flex-1 gap-4 px-6 pb-6">
        {/* Habit Name */}
        <View>
          <Animated.View style={animatedStyle}>
            <BottomSheetTextInput
              placeholder="Habit Name"
              className="px-4 py-4 text-lg text-foreground placeholder:text-muted-foreground"
              value={habitName}
              onChangeText={(text) => {
                setHabitName(text);
                if (error) setError("");
              }}
            />
          </Animated.View>

          {error && (
            <Text className="text-destructive text-sm mt-1">{error}</Text>
          )}
        </View>

        {/* Start Date */}
        <View>
          <Text className="text-foreground mb-1">Start Date</Text>
          <DatePicker value={startDate} onChange={setStartDate} />
        </View>

        {/* Duration */}
        <View>
          <Text className="text-foreground mb-1">Goal Duration</Text>

          <View className="flex-row items-center gap-2">
            <TextInput
              keyboardType="numeric"
              placeholder="10"
              className="px-6 py-2 text-lg w-24 border border-border rounded-full text-foreground placeholder:text-muted-foreground"
              value={duration}
              maxLength={1080}
              onChangeText={(text) => {
                const value = Number(text);
                if (value > 1080) {
                  setDuration("1080");
                } else {
                  setDuration(text);
                }
              }}
            />

            <Text className="text-foreground text-lg">minutes</Text>
          </View>
        </View>

        {/* Frequency */}
        <View>
          <Text className="text-foreground mb-1">Repeat</Text>
          <SegmentedControl
            options={FREQUENCY_OPTIONS}
            valueIndex={frequency}
            onChange={setFrequency}
          />
        </View>

        {/* Weekly days */}
        {frequency === 1 && (
          <View>
            <Text className="text-foreground mb-1">Days of week</Text>

            <View className="flex-row gap-2">
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
                    }}
                    className={`w-10 h-10 rounded-full items-center justify-center ${
                      selected ? "bg-primary" : "bg-border"
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        selected
                          ? "text-primary-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Monthly / Yearly date */}
        {(frequency === 2 || frequency === 3) && (
          <View>
            <Text className="text-foreground mb-1">Date</Text>
            <DatePicker value={startDate} onChange={setStartDate} />
          </View>
        )}

        {/* Reminder Toggle */}
        <View className="flex-row items-center justify-between">
          <Text className="text-foreground">Reminder</Text>

          <Switch
            value={reminderEnabled}
            onValueChange={setReminderEnabled}
          />
        </View>

        {/* Reminder Time */}
        {reminderEnabled && (
          <View>
            <Text className="text-foreground mb-1">Reminder Time</Text>
            <TimePicker value={reminderTime} onChange={setReminderTime} />
          </View>
        )}

        {/* Submit */}
        <Button
          className="mt-4"
          label="Create Habit"
          onPress={submitHabit}
        />
      </View>
      </ScrollView>
    </BottomSheet>
  );
}

export default AddHabitSheet;