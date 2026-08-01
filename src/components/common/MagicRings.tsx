/**
 * MagicRings - 点击涟漪反馈
 * 点击时从手指位置扩散圆环,支持多涟漪叠加(最多3个)
 * 零新依赖: RN Animated (useNativeDriver)
 */
import { memo, useRef, useState, useCallback } from 'react'
import { Animated, Easing, TouchableOpacity, type GestureResponderEvent } from 'react-native'

interface Ring {
  id: number
  x: number
  y: number
  anim: Animated.Value
}

interface MagicRingsProps {
  children: React.ReactNode
  onPress?: () => void
  /** 涟漪颜色,默认白色 */
  color?: string
  /** 涟漪最大半径 */
  radius?: number
  /** 是否启用(关闭时退化为普通按钮) */
  enabled?: boolean
  /** 涟漪时长 ms */
  duration?: number
  style?: any
  activeOpacity?: number
}

let ringId = 0

const MagicRings = memo(({
  children,
  onPress,
  color = '#ffffff',
  radius = 34,
  enabled = true,
  duration = 550,
  style,
  activeOpacity = 0.6,
}: MagicRingsProps) => {
  const [rings, setRings] = useState<Ring[]>([])
  const ringsRef = useRef<Ring[]>([])
  ringsRef.current = rings

  const spawnRing = useCallback((x: number, y: number) => {
    const id = ++ringId
    const anim = new Animated.Value(0)
    const ring: Ring = { id, x, y, anim }
    // 最多叠加3个,丢弃最旧的
    setRings(prev => [...prev.slice(-2), ring])
    Animated.timing(anim, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setRings(prev => prev.filter(r => r.id !== id))
    })
  }, [duration])

  const handlePress = useCallback((e: GestureResponderEvent) => {
    if (enabled) {
      const { locationX, locationY } = e.nativeEvent
      spawnRing(locationX, locationY)
    }
    onPress?.()
  }, [enabled, onPress, spawnRing])

  return (
    <TouchableOpacity
      activeOpacity={activeOpacity}
      onPress={handlePress}
      style={[{ position: 'relative' }, style]}
    >
      {children}
      {rings.map(ring => (
        <Animated.View
          key={ring.id}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: ring.x - radius,
            top: ring.y - radius,
            width: radius * 2,
            height: radius * 2,
            borderRadius: radius,
            borderWidth: 2,
            borderColor: color,
            opacity: ring.anim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.9, 0],
            }),
            transform: [{
              scale: ring.anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.15, 1],
              }),
            }],
          }}
        />
      ))}
    </TouchableOpacity>
  )
})

export default MagicRings
