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
      className={`flex-1 bg-background p-4 rounded-3xl items-center border shadow-sm ${
        isPrimary ? "border-b-4 border-primary" : "border-border"
      }`}
      style={[
        color ? { borderColor: color } : {},
      ]}
    >
      <View className="flex-row items-baseline">
        <Text className="text-2xl font-bold text-foreground">{value}</Text>
        {suffix && <Text className="text-sm font-bold text-foreground ml-0.5">{suffix}</Text>}
      </View>
      <Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider mt-1">
        {label}
      </Text>
    </View>
  );
}
