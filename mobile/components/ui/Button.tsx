import { Pressable, Text } from "react-native";
import { cn } from "@/utils/cn";

type Variant = "primary" | "outline" | "ghost" | "danger";

function Button({
  label,
  onPress,
  variant = "primary",
  className = "",
}: {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  className?: string;
}) {
  const variants: Record<Variant, string> = {
    primary: "bg-primary text-white",
    outline: "border border-border text-black",
    ghost: "bg-transparent text-primary",
    danger: "bg-danger text-white",
  };

  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "py-4 rounded-full items-center justify-center",
        variants[variant],
        className
      )}
    >
      <Text className="font-semibold text-base text-white">{label}</Text>
    </Pressable>
  );
}

export default Button;