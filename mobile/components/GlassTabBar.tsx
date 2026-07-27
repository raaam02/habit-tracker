import { View, StyleSheet, Platform, Dimensions } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from "react-native-reanimated";
import React, { useEffect } from "react";
import AnimatedPressable from "./ui/AnimatedPressable";
import { useColorScheme } from "nativewind";

const TABS = [
  { route: "/", icon: "home", label: "Home" },
  { route: "/history", icon: "calendar", label: "History" },
  { route: "/settings", icon: "settings", label: "Settings" },
] as const;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TAB_BAR_WIDTH = Math.min(SCREEN_WIDTH * 0.85, 360);
const TAB_WIDTH = (TAB_BAR_WIDTH - 12) / TABS.length; // Adjusted for padding

function TabIcon({ name, isActive, isDark }: { name: string; isActive: boolean; isDark: boolean }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(isActive ? 1.15 : 1, { damping: 15, stiffness: 220 });
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons
        name={isActive ? (name as any) : ((name + "-outline") as any)}
        size={22}
        color={isActive ? "#6366f1" : isDark ? "#71717a" : "#8e8e93"}
      />
    </Animated.View>
  );
}

export default function GlassTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const activeIndex = TABS.findIndex(t => t.route === pathname);
  const translateX = useSharedValue(activeIndex * TAB_WIDTH);

  useEffect(() => {
    translateX.value = withSpring(activeIndex * TAB_WIDTH, {
      damping: 18,
      stiffness: 160,
      mass: 0.9,
    });
  }, [activeIndex]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View pointerEvents="box-none" style={styles.wrapper}>
      <View style={[
        styles.container,
        {
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
          backgroundColor: isDark ? "rgba(18,18,18,0.85)" : "rgba(255,255,255,0.85)",
          shadowColor: isDark ? "#000" : "#aaaaaa",
        }
      ]}>
        <BlurView
          intensity={Platform.OS === "ios" ? 40 : 100}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />

        {/* Sliding Indicator */}
        <Animated.View style={[styles.activeIndicator, indicatorStyle]} />

        {TABS.map((tab, index) => {
          const isActive = index === activeIndex;

          return (
            <AnimatedPressable
              key={tab.route}
              style={styles.tab}
              onPress={() => {
                router.push(tab.route);
              }}
            >
              <TabIcon name={tab.icon} isActive={isActive} isDark={isDark} />
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 24 : 16,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  container: {
    flexDirection: "row",
    width: TAB_BAR_WIDTH,
    height: 54,
    borderRadius: 27,
    overflow: "hidden",
    borderWidth: 1,
    paddingHorizontal: 6,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 3,
  },
  tab: {
    flex: 1,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  activeIndicator: {
    position: "absolute",
    top: 7,
    left: 6,
    width: TAB_WIDTH,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(99, 102, 241, 0.08)", // Subtle active background
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.16)",
  },
});
