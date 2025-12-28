import { TextInput } from 'react-native'
import React from 'react'
import { cn } from '@/utils/cn'

const Input = ({ placeholder, className }: { placeholder: string; className?: string }) => {
  return (
    <TextInput
      placeholder={placeholder}
      className={cn("border border-border rounded-full px-4 py-3 mb-4", className)}
    />
  )
}

export default Input