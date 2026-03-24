import { Pressable, PressableProps, StyleProp, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  WithSpringConfig,
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
  animationConfig?: WithSpringConfig;
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
  scaleTo = 0.90,
  animationConfig = { damping: 20, stiffness: 200, mass: 1 },
  hapticType = "none",
  ...props
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const variants: Record<ButtonVariant, string> = {
    primary: "p-4 bg-primary text-primary-foreground justify-center items-center rounded-xl",
    secondary: "p-4 bg-secondary text-secondary-foreground justify-center items-center rounded-xl",
    muted: "p-4 bg-muted text-muted-foreground justify-center items-center rounded-xl",
    outline: "p-4 border border-border text-card-foreground justify-center items-center rounded-xl",
    ghost: "p-4 bg-transparent text-primary justify-center items-center rounded-xl",
    danger: "p-4 bg-destructive text-destructive-foreground justify-center items-center rounded-xl",
    none: "justify-center items-center",
  };

  const handlePressIn = (e: any) => {
    scale.value = withSpring(scaleTo, animationConfig);
    if (onPressIn) onPressIn(e);
    if (hapticType === "light") haptic.light();
    if (hapticType === "notificationSuccess") haptic.notificationSuccess();
    if (hapticType === "notificationError") haptic.notificationError();
    if (hapticType === "notificationWarning") haptic.notificationWarning();
  };

  const handlePressOut = (e: any) => {
    scale.value = withSpring(1, animationConfig);
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
