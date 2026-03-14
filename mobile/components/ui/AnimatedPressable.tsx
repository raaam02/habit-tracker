import { Pressable, PressableProps, StyleProp, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  WithTimingConfig,
} from "react-native-reanimated";
import { cn } from "@/utils/cn";
import { haptic } from "@/utils/haptic";

const ReanimatedPressable = Animated.createAnimatedComponent(Pressable);

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "muted" | "none";

interface AnimatedPressableProps extends Omit<PressableProps, "style"> {
  variant?: ButtonVariant;
  className?: string;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  animationConfig?: WithTimingConfig;
  hapticType?: "light" | "notificationSuccess" | "notificationError" | "notificationWarning" | "none";
}

export default function AnimatedPressable({
  onPress,
  onPressIn,
  onPressOut,
  className,
  style,
  children,
  variant = "none",
  scaleTo = 0.92,
  animationConfig = { duration: 100 },
  hapticType = "none",
  ...props
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const variants: Record<ButtonVariant, string> = {
    primary: "bg-primary text-primary-foreground py-4 rounded-full px-6 justify-center items-center",
    secondary: "bg-secondary text-secondary-foreground",
    muted: "bg-muted text-muted-foreground",
    outline: "border border-border text-card-foreground",
    ghost: "bg-transparent text-primary",
    danger: "bg-destructive text-destructive-foreground",
    none: "",
  };

  const handlePressIn = (e: any) => {
    scale.value = withTiming(scaleTo, animationConfig);
    if (onPressIn) onPressIn(e);
    if (hapticType === "light") haptic.light();
    if (hapticType === "notificationSuccess") haptic.notificationSuccess();
    if (hapticType === "notificationError") haptic.notificationError();
    if (hapticType === "notificationWarning") haptic.notificationWarning();
  };

  const handlePressOut = (e: any) => {
    scale.value = withTiming(1, { duration: 150 });
    if (onPressOut) onPressOut(e);
  };

  return (
    <ReanimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      className={cn(variants[variant], className)}
      style={[animatedStyle, style as any]}
      {...props}
    >
      {children}
    </ReanimatedPressable>
  );
}
