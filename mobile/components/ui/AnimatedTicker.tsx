import React, { useEffect } from "react";
import { View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const CHAR_HEIGHT = 32; // must match your font's line height exactly

interface TickerDigitProps {
  digit: number;
  direction: "up" | "down";
  style?: any;
}

function TickerDigit({ digit, direction, style }: TickerDigitProps) {
  const translateY = useSharedValue(-digit * CHAR_HEIGHT);
  const prevDigit = useSharedValue(digit);

  useEffect(() => {
    const prev = prevDigit.value;
    const next = digit;
    prevDigit.value = next;

    if (prev === next) return;

    if (direction === "up") {
      if (next > prev) {
        // Simple scroll up
        translateY.value = withTiming(-next * CHAR_HEIGHT, {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        });
      } else {
        // Wrapping: jump to the pre-wrap position (prev - 10), then animate to next
        translateY.value = -(prev - 10) * CHAR_HEIGHT; // instant jump, no animation
        translateY.value = withTiming(-next * CHAR_HEIGHT, {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        });
      }
    } else {
      if (next < prev) {
        // Simple scroll down
        translateY.value = withTiming(-next * CHAR_HEIGHT, {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        });
      } else {
        // Wrapping: jump to the pre-wrap position (prev + 10), then animate to next
        translateY.value = -(prev + 10) * CHAR_HEIGHT; // instant jump, no animation
        translateY.value = withTiming(-next * CHAR_HEIGHT, {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        });
      }
    }
  }, [digit, direction]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={{ height: CHAR_HEIGHT, overflow: "hidden", width: 20 }}>
      <Animated.View style={animStyle}>
        {DIGITS.map((d) => (
          <Animated.Text
            key={d}
            className="text-foreground"
            style={[style, { height: CHAR_HEIGHT, lineHeight: CHAR_HEIGHT }]}
          >
            {d}
          </Animated.Text>
        ))}
      </Animated.View>
    </View>
  );
}

interface AnimatedTickerProps {
  text: string;
  style?: any;
  direction?: "up" | "down";
}

export default function AnimatedTicker({
  text,
  style,
  direction = "up",
}: AnimatedTickerProps) {
  return (
    <View className="gap-0.5" style={{ flexDirection: "row", alignItems: "center" }}>
      {text.split("").map((char, index) => {
        const isNumber = !isNaN(Number(char)) && char !== " ";

        if (isNumber) {
          return (
            <TickerDigit
              key={index}
              digit={parseInt(char)}
              direction={direction}
              style={style}
            />
          );
        }

        // Colons, dots, separators — render static
        return (
          <Animated.Text
            key={index}
            className="text-foreground"
            style={[style, { height: CHAR_HEIGHT, lineHeight: CHAR_HEIGHT }]}
          >
            {char}
          </Animated.Text>
        );
      })}
    </View>
  );
}