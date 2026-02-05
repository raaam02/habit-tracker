// import { Tabs } from "expo-router";
// import { Ionicons } from "@expo/vector-icons";
// import { useColorScheme } from "nativewind";
// import { BlurView } from "expo-blur";
// import { Platform, StyleSheet, View } from "react-native";

// export default function TabLayout() {
//   const { colorScheme } = useColorScheme();
//   const isDark = colorScheme === "dark";

//   return (
//     <Tabs
//       screenOptions={{
//         headerShown: false,
//         tabBarStyle: {
//           position: "absolute",
//           backgroundColor: "transparent",
//           elevation: 0,
//           shadowOpacity: 0,
//           height: 70,
//           paddingBottom: 10,
//           paddingTop: 10,
//           marginHorizontal: 20,
//           marginBottom: 10,
//           borderRadius: 50,
//           overflow: "hidden",
//           borderColor: "#CFCFCF",
//           borderWidth: 0.5,
//           shadowColor: "#CFCFCF",
//           shadowOffset: { width: 0, height: 10 },
//           shadowRadius: 20,
//         },

//         tabBarBackground: () => (
//           <BlurView
//             intensity={Platform.OS === "ios" ? 80 : 100}
//             tint={isDark ? "dark" : "light"}
//             style={StyleSheet.absoluteFill}
//           />
//         ),

//         // tabBarBackground: () => (
//         //   <View style={StyleSheet.absoluteFill} pointerEvents="none">
//         //     {Platform.OS === "ios" && (
//         //       <BlurView
//         //         tint={isDark ? "dark" : "light"}
//         //         intensity={80}
//         //         experimentalBlurMethod="dimezisBlurView"
//         //         style={StyleSheet.absoluteFill}
//         //       />
//         //     )}
//         //   </View>
//         // ),

//         tabBarActiveTintColor: "#4F46E5", // Indigo-600
//         tabBarInactiveTintColor: isDark ? "#9CA3AF" : "#6B7280",

//         tabBarItemStyle: {
//           borderRadius: 50,
//         },
//       }}
//     >
//       <Tabs.Screen
//         name="index"
//         options={{
//           title: "Home",
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons name="home-outline" size={size} color={color} />
//           ),
//         }}
//       />

//       <Tabs.Screen
//         name="insights"
//         options={{
//           title: "Insights",
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons name="stats-chart-outline" size={size} color={color} />
//           ),
//         }}
//       />

//       <Tabs.Screen
//         name="history"
//         options={{
//           title: "History",
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons name="calendar-outline" size={size} color={color} />
//           ),
//         }}
//       />

//       <Tabs.Screen
//         name="settings"
//         options={{
//           title: "Settings",
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons name="settings-outline" size={size} color={color} />
//           ),
//         }}
//       />
//     </Tabs>
//   );
// }

import { Tabs } from "expo-router";
import { View, StyleSheet } from "react-native";
import GlassTabBar from "@/components/GlassTabBar";

export default function TabLayout() {
  return (
    <View style={styles.root}>
      {/* Screens */}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: "none" }, // hide native tabs
        }}
      />

      {/* Custom glass tab bar (renders once) */}
      <GlassTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
