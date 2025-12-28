import { View, Text } from "react-native";

function StreakLevelBadge({ streak }: { streak: number }) {
  let level = "Bronze";
  if (streak >= 30) level = "Gold";
  else if (streak >= 14) level = "Silver";

  return (
    <View className="px-4 py-2 rounded-full bg-bg">
      <Text className="font-medium">{level}</Text>
    </View>
  );
}

export default StreakLevelBadge;