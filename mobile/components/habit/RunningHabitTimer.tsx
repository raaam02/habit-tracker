import { View, Text, AppState } from "react-native"
import { useEffect, useState, useRef } from "react"
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
import { updateHabitProgress } from "@/services/habit-log.service"
import { haptic } from "@/utils/haptic"

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

  const lastTickRef = useRef<number>(Date.now());

  // Update the reference point whenever unpaused or when habit changes
  useEffect(() => {
    if (!paused && !finished) {
      lastTickRef.current = Date.now();
    }
  }, [paused, finished, habit.id, initialTime]);

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

    const updateTimer = () => {
      const now = Date.now();
      const deltaMs = now - lastTickRef.current;
      const deltaSecs = Math.floor(deltaMs / 1000);

      if (deltaSecs > 0) {
        setSeconds((prev) => {
          const next = prev + deltaSecs
          // Cap progress to 1 to avoid over-filling ring
          progress.value = withTiming(Math.min(1, next / totalSeconds), { duration: 950, easing: Easing.linear })
          
          if (onProgressChange) onProgressChange(next)

          if (next >= totalSeconds && !finished) {
            setFinished(true)
            updateHabitProgress(habit.id, next)
            haptic.notificationSuccess()
          }
          return next
        })
        // Advance the tick ref by exactly the deltaSecs consumed
        lastTickRef.current += deltaSecs * 1000;
      }
    };

    const timer = setInterval(updateTimer, 1000)

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        updateTimer();
      }
    });

    return () => {
      clearInterval(timer)
      subscription.remove()
    }
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
            size={250}
            strokeWidth={10}
            color={habit.color}
            progress={progress}
            finished={finished}
            onTouchEnd={() => setReverse(!reverse)}
          >
            <Ionicons name={habit.icon as any} size={22} color={habit.color} />
            <Animated.View style={timerStyle}>
              {(() => {
                const timeToDisplay = reverse ? totalSeconds - seconds : seconds;
                const hrs = Math.floor(timeToDisplay / 3600);
                const mins = Math.floor((timeToDisplay % 3600) / 60);
                const secs = timeToDisplay % 60;
                const timeString = `${hrs > 0 ? hrs.toString().padStart(2, '0') + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                return (
                  <Text
                    style={{
                      fontSize: 36,
                      fontWeight: "bold",
                      textAlign: "center",
                      color: "white",
                      fontVariant: ["tabular-nums"]
                    }}
                  >
                    {timeString}
                  </Text>
                );
              })()}
            </Animated.View>
          </ProgressRingTimer>

          {/* Progress label */}
          <Text className="text-sm text-muted-foreground">
            {progressLabel}
          </Text>

          {/* Stop / Finish button */}
          <View className="w-full mt-4">
            {finished ? (
              <View className="flex-row w-full gap-4">
                <AnimatedPressable
                  onPress={() => {
                    setSeconds(0)
                    progress.value = withTiming(0, { duration: 300 })
                    setFinished(false)
                    setPaused(false)
                  }}
                  variant="muted"
                  className="flex-1 py-4 rounded-2xl flex-row items-center justify-center gap-2"
                >
                  <Ionicons name="refresh" size={20} color="#fff" />
                  <Text className="text-foreground font-bold text-base tracking-wide">
                    Reset
                  </Text>
                </AnimatedPressable>

                <AnimatedPressable
                  onPress={() => onStop(seconds)}
                  variant="primary"
                  className="flex-1 py-4 rounded-2xl flex-row items-center justify-center gap-2"
                >
                  <Ionicons name="checkmark-done" size={20} color="#fff" />
                  <Text className="text-foreground font-bold text-base tracking-wide">
                    Finish 
                  </Text>
                </AnimatedPressable>
              </View>
            ) : (
              <View className="h-12 w-full items-center justify-center relative">
                <Animated.View style={resetAnimStyle} pointerEvents={paused ? "auto" : "none"}>
                  <AnimatedPressable
                    onPress={() => {
                      setSeconds(0)
                      progress.value = withTiming(0, { duration: 300 })
                      setFinished(false)
                    }}
                    variant="muted"
                    className="size-14 p-0"
                  >
                    <Ionicons name="refresh" size={24} color="white" />
                  </AnimatedPressable>
                </Animated.View>

                <Animated.View style={{ zIndex: 10 }}>
                  <AnimatedPressable
                    onPress={() => setPaused(!paused)}
                    variant="primary"
                    className="size-14 p-0"
                  >
                    <Ionicons name={paused ? "play" : "pause"} size={24} color="white" />
                  </AnimatedPressable>
                </Animated.View>

                <Animated.View style={completeAnimStyle} pointerEvents={paused ? "auto" : "none"}>
                  <AnimatedPressable
                    onPress={() => onStop(seconds)}
                    variant="muted"
                    className="size-14 p-0"
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