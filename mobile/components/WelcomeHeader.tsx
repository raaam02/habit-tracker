import { Ionicons } from "@expo/vector-icons"
import { Image, Text, TouchableOpacity, View } from "react-native"
import { User } from "@/types/user"
import { useRouter } from "expo-router"
import { useMemo } from "react"

const WelcomeHeader = ({user}: {user: User}) => {
  const router = useRouter();
  const welcomeMessage = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);
  return (
    <View className="flex-row justify-between items-center p-4">
      <View className="flex-row items-center space-x-4 gap-4">
        <View className="h-12 w-12 rounded-full items-center justify-center overflow-hidden">
          {/* Placeholder Avatar */}
          <Image
            source={{ uri: user.avatar }} 
            className="h-full w-full"
          />
        </View>
        <View>
          <Text className="text-foreground text-sm font-medium tracking-wide">
            {welcomeMessage}
          </Text>
          <Text className="text-foreground text-lg font-bold">
            {user.name}
          </Text>
        </View>
      </View>
      <View className="flex-row gap-2">
        {__DEV__ && (
          <TouchableOpacity 
            onPress={() => router.push("/debug/db" as any)}
            className="h-12 w-12 bg-card rounded-full items-center justify-center shadow-sm"
          >
            <Ionicons name="bug-outline" size={20} color="#fff" />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity className="h-12 w-12 bg-card rounded-full items-center justify-center shadow-sm">
          <Ionicons name="notifications-outline" size={20} color="#fff" />
          <View className="absolute top-3.5 right-4 h-1.5 w-1.5 bg-destructive rounded-full" />
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default WelcomeHeader