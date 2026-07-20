/**
 * HeroUI 风格动画工具 (基于 RN 内置 Animated)
 * 微交互: spring 弹性、渐变过渡、呼吸发光
 * 兼容 RN 0.73,无需 reanimated
 */
import { useCallback, useRef } from 'react'
import { Animated, Easing } from 'react-native'

const SPRING_CONFIG = { tension: 200, friction: 15, useNativeDriver: true }
const PRESS_SPRING = { tension: 300, friction: 12, useNativeDriver: true }

/**
 * 按钮按压弹簧动画
 * 使用:
 *   const { animatedStyle, onPressIn, onPressOut } = usePressSpring()
 *   <Animated.View style={animatedStyle}>
 *     <TouchableOpacity onPressIn={onPressIn} onPressOut={onPressOut}>...</TouchableOpacity>
 *   </Animated.View>
 */
export const usePressSpring = () => {
  const scale = useRef(new Animated.Value(1)).current

  const onPressIn = useCallback(() => {
    Animated.spring(scale, { toValue: 0.92, ...PRESS_SPRING }).start()
  }, [scale])

  const onPressOut = useCallback(() => {
    Animated.spring(scale, { toValue: 1, ...SPRING_CONFIG }).start()
  }, [scale])

  const animatedStyle = {
    transform: [{ scale }],
  }

  return { animatedStyle, onPressIn, onPressOut }
}

/**
 * 淡入动画
 * 使用:
 *   const { fadeInStyle, startFadeIn } = useFadeIn()
 *   useEffect(() => { startFadeIn() }, [])
 *   <Animated.View style={fadeInStyle}>{children}</Animated.View>
 */
export const useFadeIn = (duration = 400) => {
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(20)).current

  const fadeInStyle = {
    opacity,
    transform: [{ translateY }],
  }

  const startFadeIn = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start()
  }, [opacity, translateY, duration])

  return { fadeInStyle, startFadeIn }
}

/**
 * 呼吸发光动画
 * 使用:
 *   const { glowStyle, startBreathing, stopBreathing } = useBreathingGlow()
 *   useEffect(() => { if (isPlay) startBreathing(); else stopBreathing() }, [isPlay])
 *   <Animated.View style={[glow, glowStyle]} />
 */
export const useBreathingGlow = (initial = 0.3) => {
  const glow = useRef(new Animated.Value(initial)).current
  let loopRef: Animated.CompositeAnimation | null = null

  const startBreathing = useCallback(() => {
    if (loopRef) loopRef.stop()
    loopRef = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 0.7, duration: 1800, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.15, duration: 1800, useNativeDriver: true }),
      ])
    )
    loopRef.start()
  }, [glow])

  const stopBreathing = useCallback(() => {
    if (loopRef) {
      loopRef.stop()
      loopRef = null
    }
    Animated.timing(glow, { toValue: initial, duration: 400, useNativeDriver: true }).start()
  }, [glow, initial])

  const glowStyle = { opacity: glow }

  return { glowStyle, startBreathing, stopBreathing }
}

/**
 * 旋转动画 (持续旋转)
 */
export const useSpin = (duration = 4000) => {
  const rotate = useRef(new Animated.Value(0)).current

  const startSpin = useCallback(() => {
    Animated.timing(rotate, {
      toValue: 3600,
      duration: 3600 * duration,
      useNativeDriver: true,
    }).start()
  }, [rotate, duration])

  const stopSpin = useCallback(() => {
    rotate.stopAnimation()
  }, [rotate])

  const spinStyle = {
    transform: [
      {
        rotate: rotate.interpolate({
          inputRange: [0, 3600],
          outputRange: ['0deg', '1296000deg'],
          extrapolate: 'extend',
        }),
      },
    ],
  }

  return { spinStyle, startSpin, stopSpin }
}

export default { usePressSpring, useFadeIn, useBreathingGlow, useSpin }
