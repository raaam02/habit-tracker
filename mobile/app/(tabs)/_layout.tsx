import { Tabs } from "expo-router";
import { View, StyleSheet } from "react-native";
import GlassTabBar from "@/components/GlassTabBar";

export default function TabLayout() {
  return (
    <View style={styles.root}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="history" />
        <Tabs.Screen name="settings" />
        <Tabs.Screen name="insights" options={{ href: null }} />
      </Tabs>
      <GlassTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000000",
  },
});
