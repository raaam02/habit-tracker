import { View, Text, TextInput, Pressable, Switch } from "react-native";
import React, { useEffect, useState } from "react";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

import BottomSheet from "../ui/BottomSheet";
import Button from "../ui/Button";
import TimePicker from "../ui/TimePicker";
import DatePicker from "../ui/DatePicker";
import SegmentedControl from "../ui/SegmentControl";

import { haptic } from "@/utils/haptic";
import { ScrollView } from "react-native-gesture-handler";
import { createHabit } from "@/services/habit.service";
import { shakeAnimation } from "@/utils/animation";
import { Ionicons } from "@expo/vector-icons";
import IconPicker from "../IconPicker";
import { COLORS, DAYS_OF_WEEK, FREQUENCY_OPTIONS } from "@/utils/constants";

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
      setHabitName("");
      setDuration("10");
      setFrequency(0);
      setDays([]);
      setReminderEnabled(true);
      setStartDate(new Date());
      setReminderTime(new Date());
      setShowIconPicker(false)
      setError("");
    }
  }, [open]);

  const submitHabit = () => {
    if (!habitName.trim()) {
      setError("Habit name is required");
      haptic.notificationError();

      shake.value = shakeAnimation(6);

      return;
    }

    const habit = createHabit({
      name: habitName.trim(),
      icon: icon,
      colorName: color.name,
      color: color.color,
      bgColor: color.bgColor,
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
      <View className="flex-1 gap-6 px-6 pb-6">
        {/* Habit Icon */}
        <View>
          <View className="flex-row justify-center mt-4">
            <Pressable
              className={`w-24 h-24 rounded-full bg-muted items-center justify-center`}
              style={{
                backgroundColor: color.bgColor
              }}
              onPress={() => {
                setShowIconPicker(!showIconPicker);
                haptic.light();
              }}
            >
              <Ionicons name={icon as any} size={32} color={color.color} />
              <View className="absolute size-8 rounded-full bg-muted p-1 bottom-0 right-0 items-center justify-center">
                <Ionicons name="pencil-sharp" size={16} color="white" />
              </View>
            </Pressable>
          </View>
        </View>

        {showIconPicker && (
            <IconPicker
              onSelectIcon={setIcon}
              onSelectColor={setColor}
              onClose={setShowIconPicker}
              color={color}
              icon={icon}
              className="absolute start-6 top-32 z-10"
            />
        )}

        {/* Habit Name */}
        <View>
          <Animated.View style={animatedStyle}>
            <BottomSheetTextInput
              autoFocus
              placeholder="Habit Name"
              className="text-lg text-foreground placeholder:text-muted-foreground"
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

        {/* Frequency */}
        <View>
          {/* <Text className="text-foreground mb-1">Repeat</Text> */}
          <SegmentedControl
            options={FREQUENCY_OPTIONS}
            valueIndex={frequency}
            onChange={setFrequency}
          />
        </View>

        {/* Weekly days */}
        {frequency === 1 && (
          <View>
            <Text className="text-foreground mb-2">Days of week</Text>

            <View className="flex-row gap-4">
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
                      haptic.light()
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
        {/* <View className="flex-row items-center justify-between">
          <Text className="text-foreground">Reminder</Text>

          <Switch
            value={reminderEnabled}
            onValueChange={setReminderEnabled}
          />
        </View> */}

        {/* Duration */}
        <View className="flex-row justify-between mt-2">
          {/* <Text className="text-foreground mb-1">Goal Duration</Text> */}
          <View className="flex-row items-center gap-2">
            <TextInput
              keyboardType="numeric"
              placeholder="10"
              className="px-6 py-2 text-lg w-20 border border-border rounded-full text-foreground placeholder:text-muted-foreground"
              value={duration}
              maxLength={1080}
              onChangeText={(text) => {
                const value = parseInt(text || "0")
                
                if (value > 1080) {
                  setDuration("1080")
                } else {
                  setDuration(text.replace(/[^0-9]/g, ""))
                }
              }}
            />
            <Text className="text-foreground text-lg">minutes</Text>
          </View>
          
          {/* Reminder Time */}
          <View className="flex-row gap-2 items-center">
            <Text className="text-foreground mb-1">On</Text>
            <TimePicker value={reminderTime} onChange={setReminderTime} />
          </View>
        </View>

        {/* Submit */}
      </View>
      <Button
        className="mb-4"
        label="Create Habit"
        onPress={submitHabit}
      />
    </BottomSheet>
  );
}

export default AddHabitSheet;