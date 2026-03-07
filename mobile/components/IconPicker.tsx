import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button from "./ui/Button";
import { cn } from "@/utils/cn";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { haptic } from "@/utils/haptic";
import { COLORS, ICONS } from "@/utils/constants";

export interface color {
  name: string, 
  color: string, 
  bgColor: string
}

interface IconPickerProps {
  color: color;
  icon: string;
  onSelectIcon: (icon: string) => void;
  onSelectColor: (color: color) => void;
  onClose: (close: boolean) => void;
  className: string;
}

export default function IconPicker({ onSelectIcon, onSelectColor, onClose, color, icon, className } : IconPickerProps) {
  return (
    <Animated.View 
      className={cn("flex items-center justify-center w-full p-4 gap-4 bg-muted border border-border rounded-3xl", className)}
      entering={FadeInDown.duration(200)}
      exiting={FadeOutUp.duration(150)}
    >
      <View className="flex-row flex-wrap gap-2 items-center justify-center">
        {ICONS.map((i) => (
          <Pressable
            key={i}
            onPress={() => {
              onSelectIcon(i)
              haptic.light()
            }}
            className={cn('w-12 h-12 items-center justify-center rounded-lg')}
          >
            <Ionicons name={i as any} size={22} color={i === icon ? `${color.color}` : "#555"} />
          </Pressable>
        ))}
      </View>
      <View>
          <View className="flex-row gap-2 bg-muted p-1 rounded-lg">
            {COLORS.map((c, index) => (
              <Pressable
                key={index}
                onPress={() => {
                  onSelectColor(c)
                  haptic.light()
                }}
                className={cn('w-10 h-10 rounded-md items-center justify-center')}
                style={{ backgroundColor: c.color }}
              >
                {color.color === c.color && (
                  <Ionicons name="checkmark" size={24} color="white" />
                )}
              </Pressable>
            ))}
          </View>
        </View>
        <View className="w-full">
          <Button className="w-full" label="Close" variant="outline" onPress={() => { onClose(false); haptic.light()}} />
        </View>
    </Animated.View>
  );
}