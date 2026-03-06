import { View, Text, Pressable, LayoutChangeEvent } from "react-native";
import { useEffect, useState } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { haptic } from "@/utils/haptic";

type Props = {
  options: string[];
  valueIndex: number;
  onChange: (valueIndex: number) => void;
};

export default function SegmentedControl({
  options,
  valueIndex,
  onChange,
}: Props) {
  const [width, setWidth] = useState(0);

  const translateX = useSharedValue(0);

  const segmentWidth = width / options.length - 2;

  const onLayout = (e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  };

  const moveIndicator = (index: number) => {
    translateX.value = withTiming(index * segmentWidth, {
      duration: 280,
    });
  };

  useEffect(() => {
    if (width > 0) {
      moveIndicator(valueIndex);
    }
  }, [valueIndex, width]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: segmentWidth,
  }));

  return (
    <View
      onLayout={onLayout}
      className="flex-row bg-muted rounded-xl p-1 relative"
    >
      {/* sliding indicator */}
      <Animated.View
        className="absolute top-1 bottom-1 mx-1 bg-background rounded-lg"
        style={indicatorStyle}
      />

      {options.map((option, index) => {
        const active = index === valueIndex;

        return (
          <Pressable
            key={option}
            onPress={() => {
              moveIndicator(index);
              haptic.light();
              onChange(index);
            }}
            className="flex-1 py-2 items-center justify-center"
          >
            <Text
              className={`text-sm font-medium ${
                active ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}