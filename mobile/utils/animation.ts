import { withSequence, withTiming } from "react-native-reanimated";

export const shakeAnimation = (value: number) => {
  return withSequence(
    withTiming(-value, { duration: 40 }),
    withTiming(value, { duration: 40 }),
    withTiming(-value, { duration: 40 }),
    withTiming(value, { duration: 40 }),
    withTiming(0, { duration: 40 })
  );
};