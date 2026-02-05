import { Ionicons } from "@expo/vector-icons"
import { Image, Text, TouchableOpacity, View } from "react-native"
import { User } from "@/types/user"

const WelcomeHeader = ({user}: {user: User}) => {
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
          <Text className="text-foreground text-xs font-medium uppercase tracking-wider">
            Welcome Back
          </Text>
          <Text className="text-foreground text-xl font-bold">
            {user.name}
          </Text>
        </View>
      </View>
      <TouchableOpacity className="h-10 w-10 bg-white rounded-full items-center justify-center shadow-sm">
        <Ionicons name="notifications-outline" size={20} color="#374151" />
        <View className="absolute top-2 right-2.5 h-2 w-2 bg-red-500 rounded-full border border-white" />
      </TouchableOpacity>
    </View>
  )
}

export default WelcomeHeader