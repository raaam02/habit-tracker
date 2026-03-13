import { View, Text, Pressable } from "react-native"
import { useEffect, useState } from "react"
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated"
import Svg, { Circle } from "react-native-svg"
import { HabitInput } from "@/types/habit"
import { Ionicons } from "@expo/vector-icons"
import ProgressRingTimer from "../ui/ProgressRingTimer"

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

interface Props {
  habit: HabitInput
  onStop: () => void
}

const RING_SIZE = 192        // w-48 = 192px
const STROKE_WIDTH = 8
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function RunningHabitTimer({ habit, onStop }: Props) {
  const totalSeconds = (habit.duration ?? 10) * 60

  const [seconds, setSeconds] = useState(0)
  const [finished, setFinished] = useState(false)
  const [reverse, setReverse] = useState(false)

  const fadeIn = useSharedValue(0)
  const stopScale = useSharedValue(1)
  const progress = useSharedValue(0) // 0 → 1
  const timerAnim = useSharedValue(0)

  useEffect(() => {
    timerAnim.value = 0

    timerAnim.value = withTiming(1, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    })
  }, [reverse])

  useEffect(() => {
    fadeIn.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) })

    const timer = setInterval(() => {
      setSeconds((prev) => {
        const next = prev + 1
        progress.value = withTiming(next / totalSeconds, { duration: 950, easing: Easing.linear })

        if (next >= totalSeconds) {
          clearInterval(timer)
          setFinished(true)
        }
        return next
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const timerStyle = useAnimatedStyle(() => {
    return {
      opacity: timerAnim.value,
      transform: [
        {
          translateY: (1 - timerAnim.value) * 12, // slide up effect
        },
        {
          scale: 0.96 + timerAnim.value * 0.08, // small pop
        },
      ],
    }
  })

  const animatedCircleProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }))

  const wrapperStyle = useAnimatedStyle(() => ({ opacity: fadeIn.value }))

  const stopButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: stopScale.value }],
    width: "100%",
  }))

  const handlePressIn = () => {
    stopScale.value = withSpring(0.94, { damping: 15, stiffness: 300 })
  }
  const handlePressOut = () => {
    stopScale.value = withSpring(1, { damping: 10, stiffness: 200 })
  }

  const format = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`
  }

  const formatDuration = () => {
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    if (h > 0) return `${h}h${m > 0 ? ` ${m}m` : ""}`
    return `${m}m`
  }

  const progressPercent = Math.min(100, Math.round((seconds / totalSeconds) * 100))

  const progressLabel = finished
    ? "Session complete! 🎉"
    : seconds < 60
    ? "Just getting started"
    : `${progressPercent}% complete`

  return (
    <Animated.View style={wrapperStyle}>
      <View className="mb-6 rounded-3xl overflow-hidden bg-card">
        <View className="px-6 pt-6 pb-7 items-center gap-4">
          {/* Habit name */}
          <Text
            className="text-xl font-bold text-foreground text-center mt-1"
            numberOfLines={1}
          >
            {habit.name}
          </Text>

          {/* SVG Progress Ring */}
          <ProgressRingTimer
            size={192}
            strokeWidth={8}
            color={habit.color}
            progress={progress}
            finished={finished}
            onTouchEnd={() => setReverse(!reverse)}
          >
            <Ionicons name={habit.icon as any} size={22} color={habit.color} />

            <Animated.Text
              style={timerStyle}
              className="text-4xl font-bold tracking-tight text-foreground tabular-nums"
            >
              {format(reverse ? totalSeconds - seconds : seconds)}
            </Animated.Text>
          </ProgressRingTimer>

          {/* Progress label */}
          <Text className="text-sm text-muted-foreground">
            {progressLabel}
          </Text>

          {/* Stop / Finish button */}
          <Animated.View style={stopButtonStyle}>
            <Pressable
              onPress={onStop}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              className="mt-4 bg-primary py-4 rounded-2xl flex-row items-center justify-center gap-2"
            >
              <View className="w-5 h-5 rounded-sm bg-foreground items-center justify-center">
                <View className="w-2.5 h-2.5 bg-primary rounded-sm" />
              </View>
              <Text className="text-foreground font-bold text-base tracking-wide">
                {finished ? "Finish Session" : "Stop Session"}
              </Text>
            </Pressable>
          </Animated.View>

        </View>
      </View>
    </Animated.View>
  )
}