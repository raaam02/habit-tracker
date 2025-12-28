import { View, Text, TextInput } from "react-native";
import Button from "../ui/Button";
import BottomSheet from "../ui/BottomSheet";
import Input from "../ui/Input";
import TimePicker from "../ui/TimePicker";
import { useState } from "react";

function AddHabitSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [reminderTime, setReminderTime] = useState<Date>(new Date)
  return (
    <BottomSheet open={open} onClose={onClose}>
      <Text className="text-xl font-bold mb-4">New Habit</Text>

      {/* Habit Name */}
      <Text className="text-muted mb-1">Habit Name</Text>
      <Input placeholder="e.g. Morning Run" />

      {/* Frequency */}
      <Text className="text-muted mb-1">Frequency</Text>
      <View className="flex-row gap-2 mb-4">
        {["Daily", "Custom"].map(f => (
          <View
            key={f}
            className="px-4 py-2 rounded-full border border-border"
          >
            <Text>{f}</Text>
          </View>
        ))}
      </View>

      {/* Time */}
      <Text className="text-muted mb-1">Reminder Time</Text>
      <TimePicker value={reminderTime} onChange={(date) => setReminderTime(date)} />

      <Button label="Create Habitt" onPress={onClose} />
    </BottomSheet>
  );
}

export default AddHabitSheet;