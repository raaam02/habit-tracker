import { View, Pressable, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cn } from "@/utils/cn";
import { haptic } from "@/utils/haptic";
import { COLORS, ICONS } from "@/utils/constants";
import React from "react";

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
}

export default function IconPicker({ onSelectIcon, onSelectColor, color, icon } : IconPickerProps) {
  return (
    <View className="flex-1 w-full gap-6">

      {/* Colors Section */}
      <View>
        {/*<Text className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-3">
          Select Brand Color
        </Text>*/}
        <View className="flex-row flex-wrap gap-3 justify-center bg-muted/40 p-3 rounded-3xl border border-border/20">
          {COLORS.map((c, index) => {
            const isSelected = color.color === c.color;
            return (
              <Pressable
                key={index}
                onPress={() => {
                  onSelectColor(c);
                  haptic.light();
                }}
                style={{ backgroundColor: c.color }}
                className={cn(
                  'w-10 h-10 rounded-full items-center justify-center border-2 border-transparent shadow-sm',
                  isSelected && 'border-white'
                )}
              >
                {isSelected && (
                  <Ionicons name="checkmark" size={20} color="white" />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Icons Section */}
      <View className="flex-1">
        {/*<Text className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-3">
          Select Icon symbol
        </Text>*/}
        <View className="flex-row flex-wrap gap-2.5 items-center justify-center bg-muted/40 p-4 rounded-3xl border border-border/20">
          {ICONS.map((i) => {
            const isSelected = i === icon;
            return (
              <Pressable
                key={i}
                onPress={() => {
                  onSelectIcon(i);
                  haptic.light();
                }}
                style={{
                  backgroundColor: isSelected ? color.bgColor : "transparent",
                }}
                className={cn(
                  'w-12 h-12 items-center justify-center rounded-2xl border border-transparent',
                  isSelected && 'border-border/30'
                )}
              >
                <Ionicons
                  name={i as any}
                  size={22}
                  color={isSelected ? color.color : "#71717a"}
                />
              </Pressable>
            );
          })}
        </View>
      </View>

    </View>
  );
}
