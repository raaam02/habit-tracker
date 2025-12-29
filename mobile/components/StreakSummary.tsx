import { View, Text } from 'react-native'
import React from 'react'
import Card from './ui/Card'
import StreakLevelBadge from './charts/StreakLevelBadge'

interface StreakSummaryProps {
  streak: number;
}

const StreakSummary = ({streak}: StreakSummaryProps) => {
  const date = new Date();
  const day = date.toLocaleString('en-us', { weekday: 'long' });
  const dayOfMonth = date.getDate();
  const month = date.toLocaleString('en-us', { month: 'short' });
  const year = date.getFullYear();
  return (
    <Card>
      <View className="flex-row items-center justify-between">
        <View className='gap-1'>
          <View>
            <Text className="text-muted text-base">{day}, {dayOfMonth} {month}</Text>
          </View>
          <Text className="text-3xl font-bold">{streak} days</Text>
          <Text className="text-muted">
            Keep the streak alive 🔥
          </Text>
        </View>
        <StreakLevelBadge streak={streak} />
      </View>
    </Card>
  )
}

export default StreakSummary