/**
 * AuroraBackground - 极光流动背景
 * 零新依赖: react-native-svg 径向渐变 + RN Animated 相位差动画
 * 多个半透明光斑缓慢漂移+呼吸,形成极光流动感
 */
import { memo, useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, View, type ViewStyle } from 'react-native'
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg'

export const AURORA_PRESETS: Record<string, string[]> = {
  aurora: ['#00e676', '#00b0ff', '#d500f9'],
  sunset: ['#ff9800', '#ff1744', '#d500f9'],
  ocean: ['#00b0ff', '#1de9b6', '#00e676'],
  flame: ['#ffea00', '#ff6d00', '#ff1744'],
  neon: ['#ea80fc', '#7c4dff', '#2979ff'],
  candy: ['#ff4081', '#f48fb1', '#ea80fc'],
  gold: ['#ffea00', '#ffab00', '#ff6d00'],
  ice: ['#80d8ff', '#00b0ff', '#2979ff'],
}

interface AuroraProps {
  /** 极光颜色(2~4个),默认极光预设 */
  colors?: string[]
  /** 动画强度 0~1,默认 1 */
  intensity?: number
  style?: ViewStyle
}

interface Blob {
  color: string
  size: number   // 直径(相对屏宽倍数)
  moveX: number  // X 漂移幅度
  moveY: number  // Y 漂移幅度
  duration: number
  delay: number
  baseOpacity: number
}

const makeBlobs = (colors: string[]): Blob[] => {
  const c = colors.length >= 2 ? colors : ['#00e676', '#00b0ff']
  // 光斑数量 = 颜色数,每个光斑一种颜色,相位差错开
  return c.map((color, i) => ({
    color,
    size: 1.2 + (i % 3) * 0.25,
    moveX: 90 + (i * 37) % 90,
    moveY: 60 + (i * 23) % 70,
    duration: 9000 + i * 2500,
    delay: i * 1800,
    baseOpacity: 0.5 + (i % 2) * 0.15,
  }))
}

const AuroraBackground = memo(({ colors, intensity = 1, style }: AuroraProps) => {
  const blobs = makeBlobs(colors || AURORA_PRESETS.aurora)
  const animRef = useRef<Animated.Value[]>([])
  if (animRef.current.length !== blobs.length) {
    animRef.current = blobs.map(() => new Animated.Value(0))
  }
  const values = animRef.current

  useEffect(() => {
    const loops = values.map((v, i) => {
      const b = blobs[i]
      return Animated.loop(
        Animated.sequence([
          Animated.delay(b.delay),
          Animated.timing(v, {
            toValue: 1,
            duration: b.duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(v, {
            toValue: 0,
            duration: b.duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      )
    })
    loops.forEach(l => l.start())
    return () => loops.forEach(l => l.stop())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.container, style]}>
      {blobs.map((b, i) => {
        const t = values[i]
        // 位置: sin 相位 → 缓慢漂移
        const translateX = t.interpolate({
          inputRange: [0, 0.25, 0.5, 0.75, 1],
          outputRange: [0, b.moveX * intensity, 0, -b.moveX * intensity, 0],
        })
        const translateY = t.interpolate({
          inputRange: [0, 0.25, 0.5, 0.75, 1],
          outputRange: [0, b.moveY * intensity, 0, -b.moveY * intensity, 0],
        })
        // 呼吸: 透明度 + 轻微缩放
        const opacity = t.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [b.baseOpacity, b.baseOpacity * 1.35, b.baseOpacity],
        })
        const scale = t.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [1, 1.12, 1],
        })

        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 0,
              height: 0,
              transform: [
                { translateX },
                { translateY },
                { scale },
              ],
              opacity,
            }}
          >
            <Svg width={b.size * 400} height={b.size * 400} style={{ marginLeft: -(b.size * 200), marginTop: -(b.size * 200) }}>
              <Defs>
                <RadialGradient id={`aurora-${i}`} cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor={b.color} stopOpacity={0.55} />
                  <Stop offset="60%" stopColor={b.color} stopOpacity={0.22} />
                  <Stop offset="100%" stopColor={b.color} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Circle cx={b.size * 200} cy={b.size * 200} r={b.size * 200} fill={`url(#aurora-${i})`} />
            </Svg>
          </Animated.View>
        )
      })}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
})

export default AuroraBackground
