import { Stack } from "expo-router";
import "./global.css";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { View } from "react-native";
import { useColorScheme } from "nativewind";
import themes from "./themes";
import { useState } from "react";

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === 'dark' ? themes.main.dark : themes.main.light;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <View style={theme} className={"flex-1 bg-background text-foreground"}>
          <Stack screenOptions={{ headerShown: false }} />
        </View>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
