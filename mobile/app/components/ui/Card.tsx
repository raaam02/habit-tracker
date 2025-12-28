import { cn } from "@/app/utils/cn";
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
        "bg-bg-card rounded-2xl shadow-card p-4",
        className
      )}
    >
      {children}
    </View>
  );
}

export default Card;

