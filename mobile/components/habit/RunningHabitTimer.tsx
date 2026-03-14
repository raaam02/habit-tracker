import { View, Text } from "react-native"
import { useEffect, useState } from "react"
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated"
import { HabitInput } from "@/types/habit"
import { Ionicons } from "@expo/vector-icons"
import ProgressRingTimer from "../ui/ProgressRingTimer"
import AnimatedPressable from "../ui/AnimatedPressable"
import { getLogForHabitToday } from "@/db/habit-log.repository"

interface Props {
  habit: HabitInput
  initialTime?: number
  onStop: (trackedSeconds?: number) => void
  onProgressChange?: (seconds: number) => void
  paused: boolean
  setPaused: (paused: boolean) => void
}

export default function RunningHabitTimer({ habit, initialTime = 0, onStop, onProgressChange, paused, setPaused }: Props) {
  const totalSeconds = (habit.duration ?? 10) * 60

  const [seconds, setSeconds] = useState(initialTime)
  const [finished, setFinished] = useState(initialTime >= totalSeconds)
  const [reverse, setReverse] = useState(false)
  
  const fadeIn = useSharedValue(0)
  const progress = useSharedValue(initialTime / totalSeconds)
  const timerAnim = useSharedValue(0)
  const menuAnim = useSharedValue(0)

  useEffect(() => {
    menuAnim.value = withTiming(paused ? 1 : 0, { duration: 400, easing: Easing.out(Easing.cubic) })
  }, [paused])

  useEffect(() => {
    // When the user switches to another habit, re-initialize the clock
    setSeconds(initialTime);
    setFinished(initialTime >= totalSeconds);
    progress.value = initialTime / totalSeconds;
  }, [habit.id, initialTime]);

  const resetAnimStyle = useAnimatedStyle(() => ({
    position: "absolute",
    opacity: menuAnim.value,
    transform: [
      { translateX: -80 * menuAnim.value },
      { scale: 0.6 + 0.4 * menuAnim.value },
    ],
  }))

  const completeAnimStyle = useAnimatedStyle(() => ({
    position: "absolute",
    opacity: menuAnim.value,
    transform: [
      { translateX: 80 * menuAnim.value },
      { scale: 0.6 + 0.4 * menuAnim.value },
    ],
  }))

  useEffect(() => {
    timerAnim.value = 0

    timerAnim.value = withTiming(1, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    })
  }, [reverse])

  useEffect(() => {
    fadeIn.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) })
  }, [])

  useEffect(() => {
    if (paused || finished) return

    const timer = setInterval(() => {
      setSeconds((prev) => {
        const next = prev + 1
        progress.value = withTiming(next / totalSeconds, { duration: 950, easing: Easing.linear })
        
        if (onProgressChange) onProgressChange(next)

        if (next >= totalSeconds) {
          setFinished(true)
        }
        return next
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [paused, finished, totalSeconds])

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

  const wrapperStyle = useAnimatedStyle(() => ({ opacity: fadeIn.value }))

  const format = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`
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
          <View className="w-full mt-4">
            {finished ? (
              <AnimatedPressable
                onPress={() => onStop(seconds)}
                className="bg-primary py-4 rounded-2xl flex-row items-center justify-center gap-2"
              >
                <View className="w-5 h-5 rounded-sm bg-foreground items-center justify-center">
                  <View className="w-2.5 h-2.5 bg-primary rounded-sm" />
                </View>
                <Text className="text-foreground font-bold text-base tracking-wide">
                  Finish Session
                </Text>
              </AnimatedPressable>
            ) : (
              <View className="h-12 w-full items-center justify-center relative">
                <Animated.View style={resetAnimStyle} pointerEvents={paused ? "auto" : "none"}>
                  <AnimatedPressable
                    onPress={() => {
                      setSeconds(0)
                      progress.value = withTiming(0, { duration: 300 })
                      setFinished(false)
                    }}
                    className="bg-muted size-14 rounded-xl flex-row items-center justify-center"
                  >
                    <Ionicons name="refresh" size={24} color="white" />
                  </AnimatedPressable>
                </Animated.View>

                <Animated.View style={{ zIndex: 10 }}>
                  <AnimatedPressable
                    onPress={() => setPaused(!paused)}
                    className="bg-primary size-14 rounded-2xl flex-row items-center justify-center gap-2"
                  >
                    <Ionicons name={paused ? "play" : "pause"} size={24} color="white" />
                  </AnimatedPressable>
                </Animated.View>

                <Animated.View style={completeAnimStyle} pointerEvents={paused ? "auto" : "none"}>
                  <AnimatedPressable
                    onPress={() => onStop(seconds)}
                    className="bg-muted size-14 rounded-xl flex-row items-center justify-center"
                  >
                    <Ionicons name="checkmark" size={24} color="white" />
                  </AnimatedPressable>
                </Animated.View>
              </View>
            )}
          </View>

        </View>
      </View>
    </Animated.View>
  )
}