import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface StatsCardProps {
  label: string;
  value: string | number;
  suffix?: string;
  variant?: "default" | "primary" | "success";
  color?: string;
}

export default function StatsCard({
  label,
  value,
  suffix,
  variant = "default",
  color,
}: StatsCardProps) {
  const isPrimary = variant === "primary";

  return (
    <View
      className={`flex-1 bg-muted/10 p-5 rounded-3xl items-center border border-border/30 shadow-sm ${
        isPrimary ? "border-indigo-500/50" : ""
      }`}
      style={color ? { borderColor: color } : {}}
    >
      <View className="flex-row items-baseline">
        <Text className="text-3xl font-extrabold text-foreground tracking-tight">{value}</Text>
        {suffix && <Text className="text-xs font-bold text-muted-foreground ml-0.5">{suffix}</Text>}
      </View>
      <Text className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1">
        {label}
      </Text>
    </View>
  );
}
