/**
 * 波形加载动画 — 纯 RN Animated 实现,无原生依赖
 * 4根竖条错峰跳动,兼容所有 RN 版本
 */
import { memo, useEffect, useRef } from 'react'
import { View, Animated, StyleSheet } from 'react-native'

interface Props {
  size?: number
  style?: any
}

const Bar = memo(({ delay, color }: { delay: number; color: string }) => {
  const anim = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 250, delay, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 250, useNativeDriver: true }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [anim, delay])

  return (
    <Animated.View
      style={[
        styles.bar,
        {
          backgroundColor: color,
          transform: [{ scaleY: anim }],
        },
      ]}
    />
  )
})

export default memo(({ size = 24, style }: Props) => {
  const barSize = size * 0.18
  const gap = size * 0.08
  const color = 'rgba(255,255,255,0.8)'

  return (
    <View style={[styles.row, { width: size, height: size }, style]}>
      <Bar delay={0} color={color} />
      <View style={{ width: gap }} />
      <Bar delay={100} color={color} />
      <View style={{ width: gap }} />
      <Bar delay={200} color={color} />
      <View style={{ width: gap }} />
      <Bar delay={300} color={color} />
    </View>
  )
})

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    width: 4,
    height: '60%',
    borderRadius: 2,
  },
})
