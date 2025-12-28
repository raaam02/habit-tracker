import { View, Text } from 'react-native'
import React from 'react'

const Badge = ({ label }: { label: string }) => {
  return (
    <View className="px-4 py-2 rounded-full border border-border">
      <Text className="text-sm font-semibold">{label}</Text>
    </View>
  )
}

export default Badge