import { View, Text, Pressable, LayoutChangeEvent } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { haptic } from "@/utils/haptic";

type Option = string | { label: string; icon: string };

type Props = {
  options: Option[];
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

  const segmentWidth = width > 0 ? width / options.length - 2 : 0;

  const onLayout = (e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  };

  const moveIndicator = useCallback((index: number) => {
    if (segmentWidth > 0) {
      translateX.value = withTiming(index * segmentWidth, {
        duration: 250,
      });
    }
  }, [segmentWidth, translateX]);

  useEffect(() => {
    if (width > 0) {
      moveIndicator(valueIndex);
    }
  }, [valueIndex, width, moveIndicator]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: segmentWidth || "100%",
  }));

  return (
    <View
      onLayout={onLayout}
      className="flex-row bg-muted/50 rounded-2xl p-1 relative"
    >
      {/* sliding indicator */}
      {width > 0 && (
        <Animated.View
          className="absolute top-1 bottom-1 mx-1 bg-background rounded-xl"
          style={indicatorStyle}
        />
      )}

      {options.map((option, index) => {
        const active = index === valueIndex;
        const isObject = typeof option !== "string";
        const label = isObject ? option.label : option;
        const iconName = isObject ? option.icon : undefined;

        return (
          <Pressable
            key={index}
            onPress={() => {
              moveIndicator(index);
              haptic.light();
              onChange(index);
            }}
            className="flex-1 py-3 items-center justify-center flex-row gap-2"
          >
            {iconName && (
              <Ionicons
                name={iconName as any}
                size={16}
                color={active ? "#6366f1" : "#71717a"}
              />
            )}
            <Text
              className={`text-sm font-semibold tracking-tight ${
                active ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
