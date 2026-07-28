import { Ionicons } from "@expo/vector-icons"
import { Image, Text, Pressable, View } from "react-native"
import { User } from "@/types/user"
import { useRouter } from "expo-router"
import React, { useMemo } from "react"

interface WelcomeHeaderProps {
  user: User;
  completedCount: number;
  totalCount: number;
}

export default function WelcomeHeader({ user, completedCount = 0, totalCount = 0 }: WelcomeHeaderProps) {
  const router = useRouter();

  // Dynamic formatted date e.g. "THURSDAY, JULY 9"
  const formattedDate = useMemo(() => {
    const today = new Date();
    return today.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }).toUpperCase();
  }, []);

  // Completion percentage
  const progressRatio = totalCount > 0 ? completedCount / totalCount : 0;
  const progressPercent = Math.min(100, Math.round(progressRatio * 100));

  return (
    <View className="px-4 pt-6 pb-2">
      {/* Top Profile & Utility Row */}
      <View className="flex-row justify-between items-center mb-6">
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 rounded-full items-center justify-center overflow-hidden border border-border/10 bg-muted/20">
            <Image
              source={{ uri: user.avatar }} 
              className="h-full w-full"
            />
          </View>
          <View>
            <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              Welcome back
            </Text>
            <Text className="text-foreground text-sm font-extrabold tracking-tight">
              {user.name}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-2">
          {__DEV__ && (
            <Pressable 
              onPress={() => router.push("/debug/db" as any)}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              className="h-10 w-10 bg-card border border-border/10 rounded-full items-center justify-center shadow-sm"
            >
              <Ionicons name="bug" size={18} color="#71717a" />
            </Pressable>
          )}
          
          <Pressable 
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            className="h-10 w-10 bg-card border border-border/10 rounded-full items-center justify-center shadow-sm"
          >
            <Ionicons name="notifications-outline" size={18} color="#71717a" />
            <View className="absolute top-2.5 right-3 h-1.5 w-1.5 bg-red-500 rounded-full" />
          </Pressable>
        </View>
      </View>

      {/* Date & Completion Header (Matches screenshot style) */}
      <View>
        <Text className="text-[11px] font-bold text-muted-foreground/80 tracking-widest uppercase">
          {formattedDate}
        </Text>
        <Text className="text-3xl font-extrabold text-foreground tracking-tight mt-1">
          {completedCount} of {totalCount} done
        </Text>

        {/* Thick elegant Progress bar */}
        <View className="h-2 w-full bg-muted/30 rounded-full mt-4 overflow-hidden border border-border/5">
          <View 
            style={{ width: `${progressPercent}%` }}
            className="h-full rounded-full bg-orange-500"
          />
        </View>
      </View>
    </View>
  );
}