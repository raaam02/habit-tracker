import { View } from "react-native"
import Animated, {
  SharedValue,
  useAnimatedProps,
} from "react-native-reanimated"
import Svg, { Circle } from "react-native-svg"

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

interface Props {
  size?: number
  strokeWidth?: number
  color: string
  progress: SharedValue<number>
  finished?: boolean
  children?: React.ReactNode
  onTouchEnd?: () => void
}

export default function ProgressRingTimer({
  size = 192,
  strokeWidth = 8,
  color,
  progress,
  finished = false,
  children,
  onTouchEnd,
}: Props) {

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  const animatedCircleProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }))

  return (
    <View onTouchEnd={onTouchEnd} style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color + "30"}
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Progress */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={finished ? "#22c55e" : color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          animatedProps={animatedCircleProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      {/* Center content */}
      <View
        style={{
          position: "absolute",
          width: size,
          height: size,
        }}
        className="items-center justify-center"
      >
        {children}
      </View>
    </View>
  )
}

// Old non reusable raw code of claude
{/* <View onTouchEnd={() => setReverse(!reverse)} className="mt-8 mb-2" style={{ width: RING_SIZE, height: RING_SIZE }}>
  <Svg width={RING_SIZE} height={RING_SIZE}> */}
    {/* Track */}
    // <Circle
    //   cx={RING_SIZE / 2}
    //   cy={RING_SIZE / 2}
    //   r={RADIUS}
    //   stroke={habit.color + "30"}
    //   strokeWidth={STROKE_WIDTH}
    //   fill="transparent"
    // />
    {/* Progress arc */}
  //   <AnimatedCircle
  //     cx={RING_SIZE / 2}
  //     cy={RING_SIZE / 2}
  //     r={RADIUS}
  //     stroke={finished ? "#22c55e" : habit.color}
  //     strokeWidth={STROKE_WIDTH}
  //     fill="transparent"
  //     strokeDasharray={CIRCUMFERENCE}
  //     animatedProps={animatedCircleProps}
  //     strokeLinecap="round"
  //     rotation="-90"
  //     origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
  //   />
  // </Svg>

  {/* Center content */}
//   <View
//     style={{ position: "absolute", top: 0, left: 0, width: RING_SIZE, height: RING_SIZE }}
//     className="items-center justify-center gap-1"
//   >
//     <Ionicons name={habit.icon as any} size={22} color={habit.color} />
//     <Animated.Text style={timerStyle} className="text-4xl font-bold tracking-tight text-foreground tabular-nums">
//       {format(reverse ? totalSeconds - seconds : seconds)}
//     </Animated.Text>
//   </View>
// </View>