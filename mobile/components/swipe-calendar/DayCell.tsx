import React, { memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSequence, withTiming, withSpring, runOnJS,
} from "react-native-reanimated";
import { fromIso } from "./dateUtils";
import { CELL_W, CELL_H } from "./constants";
import { useColorScheme } from "nativewind";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  iso: string;
  isSelected: boolean;
  isToday: boolean;
  hasMarker: boolean;
  accent: string;
  onPress: () => void;
}

export const DayCell = memo(function DayCell({
  iso, isSelected, isToday, hasMarker, accent, onPress,
}: Props) {
  const scale = useSharedValue(1);
  const day   = fromIso(iso).getDate();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.78, { duration: 55 }),
      withSpring(1, { damping: 10, stiffness: 300, mass: 0.5 }),
    );
    runOnJS(onPress)();
  };

  let bg: string = "transparent";
  let fg: string = isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.75)";
  let fw: "500" | "700" | "800" = "500";

  if (isSelected)   { bg = isDark ? "#ffffff22" : "#00000011"; fg = accent; fw = "800"; }
  else if (isToday) { bg = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"; fg = isDark ? "#fff" : "#000"; fw = "700"; }

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={handlePress}
      style={[styles.touch, { width: CELL_W }]}>
      <Animated.View style={[styles.circle, { backgroundColor: bg }, animStyle]}>
        <Text className="text-base" style={{ color: fg, fontWeight: fw }}>{day}</Text>
        {hasMarker && (
          <Ionicons className="absolute bottom-1" name="checkmark" size={10} color={isSelected ? accent : isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)"} />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  touch:  { alignItems: "center", paddingVertical: 2 },
  circle: {
    width: CELL_W - 8, height: CELL_H - 8,
    borderRadius: (CELL_W - 4) / 2,
    alignItems: "center", justifyContent: "center",
  },
});