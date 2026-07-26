import { View, StyleSheet, Platform, Dimensions } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
  interpolateColor,
} from "react-native-reanimated";
import { useEffect } from "react";
import AnimatedPressable from "./ui/AnimatedPressable";
import { useColorScheme } from "nativewind";

const TABS = [
  { route: "/", icon: "home", label: "Home" },
  { route: "/history", icon: "calendar", label: "History" },
  { route: "/settings", icon: "settings", label: "Settings" },
] as const;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TAB_BAR_WIDTH = SCREEN_WIDTH * 0.90;
const TAB_WIDTH = TAB_BAR_WIDTH / TABS.length;

export default function GlassTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const activeIndex = TABS.findIndex(t => t.route === pathname);
  const translateX = useSharedValue(activeIndex * TAB_WIDTH);

  useEffect(() => {
    translateX.value = withSpring(activeIndex * TAB_WIDTH, {
      damping: 20,
      stiffness: 150,
      mass: 0.8,
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
          borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
          backgroundColor: isDark ? "rgba(20,20,20,0.98)" : "rgba(255,255,255,0.98)",
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
              onPress={() => router.push(tab.route)}
              // hapticType="light"
            >
              <Ionicons
                name={isActive ? tab.icon : (tab.icon + "-outline") as any}
                size={22}
                color={isActive ? "#4F46E5" : isDark ? "#A0A0A0" : "#606060"}
              />
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
    bottom: 15,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  container: {
    flexDirection: "row",
    width: TAB_BAR_WIDTH,
    maxWidth: 400,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
    borderWidth: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 3,
  },
  tab: {
    flex: 1,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  activeIndicator: {
    position: "absolute",
    top: 8,
    left: 8,
    width: TAB_WIDTH - 16,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#4F46E515", // Subtle active background
    borderWidth: 1.5,
    borderColor: "#4F46E530",
  },
});
