import { Stack } from "expo-router";
import "./global.css";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { View } from "react-native";
import { useColorScheme } from "nativewind";
import themes from "./themes";
import { useEffect } from "react";
import { initDatabase } from "@/db/database";

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === 'dark' ? themes.main.dark : themes.main.light;

  useEffect(() => {
    initDatabase();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={theme} className={"flex-1 bg-background text-foreground"}>
        <BottomSheetModalProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </BottomSheetModalProvider>
      </View>
    </GestureHandlerRootView>
  );
}
