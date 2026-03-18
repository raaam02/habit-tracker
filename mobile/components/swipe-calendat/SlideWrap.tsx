import React, { useRef, useEffect } from "react";
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, cancelAnimation,
} from "react-native-reanimated";
import { SCREEN_W } from "./constants";

interface Props {
  pageKey: string;
  direction: "left" | "right" | "none";
  children: React.ReactNode;
}

export function SlideWrap({ pageKey, direction, children }: Props) {
  const translateX = useSharedValue(0);
  const prevKey    = useRef(pageKey);

  useEffect(() => {
    if (prevKey.current === pageKey) return;
    prevKey.current = pageKey;
    if (direction === "none") return;
    const from = direction === "left" ? SCREEN_W * 0.6 : -SCREEN_W * 0.6;
    cancelAnimation(translateX);
    translateX.value = from;
    translateX.value = withSpring(0, { damping: 22, stiffness: 260, mass: 0.6 });
  }, [pageKey]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return <Animated.View style={animStyle}>{children}</Animated.View>;
}