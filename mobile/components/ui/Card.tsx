import { cn } from "@/utils/cn";
import { View } from "react-native";

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View
      className={cn(
        "bg-card rounded-2xl shadow-card p-5",
        className
      )}
    >
      {children}
    </View>
  );
}

export default Card;

