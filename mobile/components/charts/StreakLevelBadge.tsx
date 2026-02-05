import { View, Text } from "react-native";

function StreakLevelBadge({ streak }: { streak: number }) {
  let level = "Bronze";
  let bgColor = "bg-amber-700";

  if (streak >= 30) {
    level = "Gold";
    bgColor = "bg-yellow-600";
  } else if (streak >= 14) {
    level = "Silver";
    bgColor = "bg-slate-800";
  }

  return (
    <View className={`px-4 py-2 rounded-full ${bgColor}`}>
      <Text className="font-medium text-foreground">{level}</Text>
    </View>
  );
}

export default StreakLevelBadge;