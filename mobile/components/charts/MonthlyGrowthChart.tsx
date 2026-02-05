import { View } from "react-native";
import Card from "../ui/Card";

const DATA = [60, 75, 40, 90, 50, 80, 65, 70, 85, 60, 75, 40];

function MonthlyGrowthChart() {
  return (
    <Card>
      <View className="flex-row items-end justify-between h-36 gap-2">
        {DATA.map((v, i) => (
          <View key={i} className="items-center flex-1">
            <View
              style={{ height: `${v}%` }}
              className="w-full bg-primary rounded-t-xl rounded-b"
            />
          </View>
        ))}
      </View>
    </Card>
  );
}

export default MonthlyGrowthChart;