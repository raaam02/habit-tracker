import { cn } from "@/utils/cn";
import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

interface ConfirmModalProps {
  visible: boolean;
  title?: string;
  description?: string;

  confirmText?: string;
  cancelText?: string;

  variant?: "default" | "destructive";

  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  visible,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      scale.value = withTiming(1, { duration: 180 });
      opacity.value = withTiming(1, { duration: 180 });
    } else {
      scale.value = withTiming(0.95, { duration: 120 });
      opacity.value = withTiming(0, { duration: 120 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Modal transparent animationType="none">
      <Pressable
        className="flex-1 items-center justify-center bg-black/40 px-6"
        onPress={onCancel}
      >
        <Animated.View
          style={animatedStyle}
          className="w-full rounded-3xl bg-muted p-6"
        >
          {/* TITLE */}
          {title && (
            <Text className="text-lg font-bold text-foreground">
              {title}
            </Text>
          )}

          {/* DESCRIPTION */}
          {description && (
            <Text className="text-muted-foreground mt-2">
              {description}
            </Text>
          )}

          {/* ACTIONS */}
          <View className="flex-row justify-end gap-3 mt-6">
            <Pressable
              onPress={onCancel}
              className="px-4 py-2 rounded-xl"
            >
              <Text className="text-foreground font-semibold">
                {cancelText}
              </Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              className={`px-4 py-2 rounded-xl`}
            >
              <Text className={cn("text-foreground font-semibold", variant === "destructive" ? "text-destructive" : "")}>
                {confirmText}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}