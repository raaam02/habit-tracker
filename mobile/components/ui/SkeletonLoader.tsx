import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from "react-native-reanimated";

interface SkeletonProps {
  className?: string;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
}

export function Skeleton({ className, width, height, borderRadius = 8 }: SkeletonProps) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 650 }),
        withTiming(0.4, { duration: 650 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height: height as any,
          borderRadius: borderRadius,
        } as any,
        animatedStyle,
      ]}
      className={`bg-muted/40 ${className || ""}`}
    />
  );
}

export function SkeletonCard() {
  return (
    <View className="bg-card p-4 rounded-3xl border border-border flex-row items-center gap-4 my-1.5 h-20">
      <Skeleton width={44} height={44} borderRadius={22} />
      <View className="flex-1 gap-2">
        <Skeleton width="60%" height={14} />
        <Skeleton width="40%" height={10} />
      </View>
      <Skeleton width={36} height={36} borderRadius={18} />
    </View>
  );
}

export function SkeletonGrid() {
  return (
    <View className="bg-card rounded-3xl p-5 border border-border mt-6">
      <View className="flex-row justify-between mb-4">
        <Skeleton width="30%" height={14} />
        <Skeleton width="20%" height={10} />
      </View>
      <View className="flex-row gap-1 justify-between">
        {[...Array(16)].map((_, i) => (
          <View key={i} className="flex-col gap-1">
            {[...Array(7)].map((_, j) => (
              <Skeleton key={j} width={14} height={14} borderRadius={3} />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

export function SkeletonProfile() {
  return (
    <View className="bg-card p-6 rounded-3xl border border-border flex-row items-center gap-4 mb-6">
      <Skeleton width={64} height={64} borderRadius={32} />
      <View className="flex-1 gap-2">
        <Skeleton width="70%" height={18} />
        <Skeleton width="50%" height={12} />
      </View>
    </View>
  );
}
