import { TextInput } from 'react-native'
import React from 'react'
import { cn } from '@/utils/cn'

const Input = ({ placeholder, className, value, onChangeText }: { placeholder?: string; className?: string; value: string; onChangeText: (text: string) => void }) => {
  return (
    <TextInput
      placeholder={placeholder}
      className={cn("border border-border rounded-full px-4 py-3 mb-4", className)}
      value={value}
      onChangeText={onChangeText}
    />
  )
}

export default Input