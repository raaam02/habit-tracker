import { View, Text, Pressable } from 'react-native'
import React, { useState } from 'react'
import DateTimePicker from '@react-native-community/datetimepicker';
import { cn } from '@/utils/cn';

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  className?: string;
}

const DatePicker = ({value, onChange, className} : DatePickerProps) => {
  const [show, setShow] = useState(false);
  return (
    <View className={cn(className)}>
      <Pressable
        onPress={() => setShow(true)}
        className="border border-border rounded-full px-4 py-3"
      >
        <Text className="text-foreground">{value.toLocaleDateString([], { day: '2-digit', month: 'long', year: 'numeric' })}</Text>
      </Pressable>

      {show && (
        <DateTimePicker
          value={value}
          mode="date"
          display="default"
          onValueChange={(_event, date) => {
            if (date) {
              onChange(date);
            }
          }}
          onDismiss={() => {
            setShow(false);
          }}
        />
      )}
    </View>
  )
}

export default DatePicker