import { View } from "react-native";

function ProgressBar({ value }: { value: number }) {
  return (
    <View className="h-2 bg-border rounded-full overflow-hidden">
      <View
        style={{ width: `${value}%` }}
        className="h-full bg-primary rounded-full"
      />
    </View>
  );
}

export default ProgressBar;