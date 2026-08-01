/**
 * ShinyText - 闪光扫过文字
 * 高光条在文字上周期性扫过,适合歌名/标题高亮
 * 零新依赖: RN Animated (useNativeDriver)
 */
import { memo, useEffect, useRef, useState } from 'react'
import { Animated, Easing, View, Text, StyleSheet, type LayoutChangeEvent, type TextStyle } from 'react-native'

interface ShinyTextProps {
  text: string
  color?: string
  /** 高光条颜色 */
  shineColor?: string
  /** 文字样式 */
  style?: TextStyle | TextStyle[]
  /** 扫过时长 ms */
  duration?: number
  /** 两次扫过间隔 ms */
  delay?: number
  enabled?: boolean
}

const ShinyText = memo(({
  text,
  color,
  shineColor = 'rgba(255,255,255,0.3)',
  style,
  duration = 2200,
  delay = 1800,
  enabled = true,
}: ShinyTextProps) => {
  const [width, setWidth] = useState(0)
  const progress = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!enabled || width <= 0) return
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(progress, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(delay),
        Animated.timing(progress, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [enabled, width, duration, delay, progress])

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width
    if (w > 0) setWidth(w)
  }

  // 高光条位移: -100% → 300% (像素)
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 1.0, width * 3.0],
  })

  return (
    <View onLayout={onLayout} style={styles.container}>
      <Text
        style={[{ color }, style]}
        numberOfLines={1}
      >
        {text}
      </Text>
      {enabled && width > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.shine,
            {
              width: width * 0.38,
              backgroundColor: shineColor,
              transform: [{ translateX }, { skewX: '-20deg' }],
            },
          ]}
        />
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  shine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
})

export default ShinyText
