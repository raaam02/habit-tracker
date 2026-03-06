import React, { useState } from 'react'
import { View, Text, TouchableOpacity, Platform, Pressable } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { cn } from '@/utils/cn'

type TimePickerProps = {
  value: Date
  onChange: (date: Date) => void,
  className?: string
}

const TimePicker: React.FC<TimePickerProps> = ({ value, onChange, className }) => {
  const [show, setShow] = useState(false)

  const handleChange = (_: any, selectedTime?: Date) => {
    setShow(false)
    if (selectedTime) {
      onChange(selectedTime)
    }
  }

  const formattedTime = value.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <View className={cn(className)}>
      <Pressable
        onPress={() => setShow(true)}
        className="border border-border rounded-full px-4 py-3"
      >
        <Text className="text-foreground">{formattedTime}</Text>
      </Pressable>

      {show && (
        <DateTimePicker
          value={value}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
        />
      )}
    </View>
  )
}

export default TimePicker
