import React, { useState } from 'react'
import { View, Text, TouchableOpacity, Platform, Pressable } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'

type TimePickerProps = {
  value: Date
  onChange: (date: Date) => void
}

const TimePicker: React.FC<TimePickerProps> = ({ value, onChange }) => {
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
    <View className="mb-6">
      <Pressable
        onPress={() => setShow(true)}
        className="border border-border rounded-full px-4 py-3"
      >
        <Text>{formattedTime}</Text>
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
