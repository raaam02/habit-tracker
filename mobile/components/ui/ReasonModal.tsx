import { cn } from "@/utils/cn";
import React, { useState } from "react";
import { Modal, Pressable, Text, View, TextInput } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

interface ReasonModalProps {
  visible: boolean;
  title?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export default function ReasonModal({
  visible,
  title = "Skip Habit",
  placeholder = "Why are you skipping today?",
  confirmText = "Skip",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}: ReasonModalProps) {
  const [reason, setReason] = useState("");
  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      setReason("");
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

  const handleConfirm = () => {
    onConfirm(reason);
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="none">
      <Pressable
        className="flex-1 items-center justify-center bg-black/50 px-6"
        onPress={onCancel}
      >
        <Animated.View
          style={animatedStyle}
          className="w-full rounded-3xl bg-muted p-6"
        >
          {/* TITLE */}
          <Text className="text-xl font-bold text-foreground">
            {title}
          </Text>

          {/* INPUT */}
          <TextInput
            autoFocus
            className="w-full bg-background/50 rounded-2xl p-4 mt-4 text-foreground text-base border border-border/50"
            placeholder={placeholder}
            placeholderTextColor="#9ca3af"
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* ACTIONS */}
          <View className="flex-row justify-end gap-3 mt-6">
            <Pressable
              onPress={onCancel}
              className="px-6 py-2.5 rounded-2xl"
            >
              <Text className="text-foreground font-semibold text-base">
                {cancelText}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleConfirm}
              className="px-6 py-2.5 rounded-2xl bg-primary"
            >
              <Text className="text-primary-foreground font-bold text-base">
                {confirmText}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
