import React, { useEffect, useState } from "react";
import {
  View,
  Modal,
  Pressable,
  LayoutRectangle,
  Dimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

type Side = "top" | "bottom" | "left" | "right";
type Align = "start" | "center" | "end";

interface PopoverProps {
  visible: boolean;
  anchorRef: React.RefObject<View | null>;
  children: React.ReactNode;
  onClose: () => void;

  side?: Side;
  align?: Align;
  offset?: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function Popover({
  visible,
  anchorRef,
  children,
  onClose,
  side = "bottom",
  align = "center",
  offset = 8,
}: PopoverProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.96);

  const [anchorLayout, setAnchorLayout] = useState<LayoutRectangle | null>(null);
  const [contentSize, setContentSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (visible && anchorRef?.current) {
      anchorRef.current.measureInWindow((x, y, width, height) => {
        setAnchorLayout({ x, y, width, height });
      });

      opacity.value = withTiming(1, {
        duration: 140,
        easing: Easing.out(Easing.cubic),
      });

      scale.value = withTiming(1, {
        duration: 140,
      });
    } else {
      opacity.value = withTiming(0, { duration: 100 });
      scale.value = withTiming(0.96, { duration: 100 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!visible || !anchorLayout) return null;

  const { x, y, width, height } = anchorLayout;
  const { width: popW, height: popH } = contentSize;

  let top = 0;
  let left = 0;

  /** ---------- SIDE ---------- */

  switch (side) {
    case "top":
      top = y - popH - offset + 20;
      break;

    case "bottom":
      top = y + height + offset;
      break;

    case "left":
      left = x - popW - offset;
      break;

    case "right":
      left = x + width + offset;
      break;
  }

  /** ---------- ALIGN ---------- */

  if (side === "top" || side === "bottom") {
    switch (align) {
      case "start":
        left = x;
        break;

      case "center":
        left = x + width / 2 - popW / 2;
        break;

      case "end":
        left = x + width - popW;
        break;
    }
  }

  if (side === "left" || side === "right") {
    switch (align) {
      case "start":
        top = y;
        break;

      case "center":
        top = y + height / 2 - popH / 2;
        break;

      case "end":
        top = y + height - popH;
        break;
    }
  }

  /** ---------- SCREEN CLAMP ---------- */

  if (left < 8) left = 8;
  if (left + popW > SCREEN_WIDTH - 8) left = SCREEN_WIDTH - popW - 8;

  if (top < 8) top = 8;
  if (top + popH > SCREEN_HEIGHT - 8)
    top = SCREEN_HEIGHT - popH - 8;

  return (
    <Modal transparent animationType="none">
      <Pressable style={{ flex: 1 }} onPress={onClose}>
        <Animated.View
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setContentSize({ width, height });
          }}
          className="rounded-2xl absolute z-50 bg-muted p-2"
          style={[
            {
              top,
              left,
            },
            animatedStyle,
          ]}
        >
          {children}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}