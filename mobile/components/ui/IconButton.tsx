import { Pressable } from "react-native";
import { cn } from "@/utils/cn";

function IconButton({
  children,
  onPress,
  className = "",
}: {
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "w-12 h-12 rounded-full items-center justify-center bg-primary shadow-soft",
        className
      )}
    >
      {children}
    </Pressable>
  );
}

export default IconButton;