import { View, Pressable, StyleSheet, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useEffect } from "react";

const TABS = [
  { route: "/", icon: "home", label: "Home" },
  { route: "/insights", icon: "stats-chart", label: "Insights" },
  { route: "/history", icon: "calendar", label: "History" },
  { route: "/settings", icon: "settings", label: "Settings" },
] as const;

const TAB_WIDTH = 80;

export default function GlassTabBar() {
  const router = useRouter();
  const pathname = usePathname();

  const activeIndex = TABS.findIndex(t => t.route === pathname);
  const translateX = useSharedValue(activeIndex * TAB_WIDTH);

  useEffect(() => {
    translateX.value = withSpring(activeIndex * TAB_WIDTH, {
      damping: 72,
      stiffness: 600,
    });
  }, [activeIndex]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <View style={styles.container}>
        {/* Glass background */}
        <BlurView
          intensity={Platform.OS === "ios" ? 80 : 30}
          tint="light"
          style={StyleSheet.absoluteFill}
        />

        {/* Active pill */}
        <Animated.View style={[styles.activePill, indicatorStyle]} />

        {TABS.map((tab, index) => {
          const isActive = index === activeIndex;

          return (
            <Pressable
              key={tab.route}
              style={styles.tab}
              onPress={() => router.push(tab.route)}
            >
              <Ionicons
                name={isActive ? tab.icon : tab.icon + "-outline" as any}
                size={22}
                color={isActive ? "#4F46E5" : "#FFFFFF"}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 4,
    alignSelf: "center",
    flexDirection: "row",
    width: TAB_WIDTH * TABS.length,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0)",
    borderWidth: 0.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  tab: {
    width: TAB_WIDTH,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  activePill: {
    position: "absolute",
    width: TAB_WIDTH,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
});
