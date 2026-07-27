import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AnimatedPressable from "./AnimatedPressable";

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  ctaText?: string;
  onCtaPress?: () => void;
}

export default function EmptyState({ icon, title, description, ctaText, onCtaPress }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <View className="bg-primary/10 p-6 rounded-full mb-5 border border-primary/10">
        <Ionicons name={icon as any} size={40} color="#6366f1" />
      </View>
      <Text className="text-xl font-bold text-foreground text-center mb-2 tracking-tight">
        {title}
      </Text>
      <Text className="text-muted-foreground text-center text-sm leading-5 max-w-[280px] mb-6">
        {description}
      </Text>
      {ctaText && onCtaPress && (
        <AnimatedPressable
          onPress={onCtaPress}
          variant="primary"
          className="px-6 py-3 rounded-full"
          hapticType="light"
        >
          <Text className="text-primary-foreground font-bold text-sm">{ctaText}</Text>
        </AnimatedPressable>
      )}
    </View>
  );
}
