import { View, Text } from "react-native";

function StreakLevelBadge({ streak }: { streak: number }) {
  let level = "Bronze";
  let bgColor = "bg-amber-600/10 border border-amber-600/25";
  let textColor = "text-amber-600";

  if (streak >= 30) {
    level = "Gold";
    bgColor = "bg-yellow-500/10 border border-yellow-500/25";
    textColor = "text-yellow-600";
  } else if (streak >= 14) {
    level = "Silver";
    bgColor = "bg-slate-500/10 border border-slate-500/25";
    textColor = "text-slate-500";
  }

  return (
    <View className={`px-4 py-1.5 rounded-full border ${bgColor}`}>
      <Text className={`font-bold text-xs ${textColor}`}>{level}</Text>
    </View>
  );
}

export default StreakLevelBadge;