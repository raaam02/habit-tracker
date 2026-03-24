import { useColorScheme } from "nativewind";
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import AnimatedPressable from "../ui/AnimatedPressable";
import { Ionicons } from "@expo/vector-icons";

const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons);

interface Props {
  headerLabel: string;
  todayLabel: string;
  expanded: boolean;
  arrowStyle: any;
  onTodayPress: () => void;
  onTitlePress: () => void;
}

export function TopBar({ headerLabel, todayLabel, expanded, arrowStyle, onTodayPress, onTitlePress }: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  return (
    <View style={styles.bar}>
      <AnimatedPressable variant="muted" className="p-2 px-3 mt-1" onPress={onTodayPress}>
        <Text className="text-sm font-semibold tracking-wide text-foreground">{todayLabel}</Text>
      </AnimatedPressable>

      <AnimatedPressable className="flex flex-row items-center gap-2 p-2" onPress={onTitlePress} variant="ghost">
        <Text className={`font-semibold text-base tracking-wide text-foreground`}>{headerLabel}</Text>
        <AnimatedIonicons style={arrowStyle} name="chevron-down" size={14} color={isDark ? "#fff" : "#000"} />
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
});