import { View, Text } from "react-native";
import { CELL_W } from "./constants";

export function DayLabelRow({ isDark, labels }: { isDark: boolean, labels: string[] }) {
  return (
    <View className="flex flex-row justify-between mb-2">
      {labels.map((l, i) => (
        <Text key={i} className="text-center text-sm font-semibold text-foreground" style={{ width: CELL_W }}>{l}</Text>
      ))}
    </View>
  );
}