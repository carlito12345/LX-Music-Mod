/**
 * StarfieldBackground - 粒子星空背景插件
 * 独立插件,不侵入核心功能
 */
import React, { memo, useEffect, useRef } from 'react'
import { View, Animated, Easing, Dimensions, StyleSheet } from 'react-native'
import { useIsPlay } from '@/store/player/hook'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'

const STAR_COUNT = 80
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window')

interface StarConfig {
  x: number
  y: number
  size: number
  opacity: number
  duration: number
  delay: number
  driftX: number
  driftY: number
  driftDuration: number
}

const createStars = (): StarConfig[] => {
  const stars: StarConfig[] = []
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * SCREEN_W,
      y: Math.random() * SCREEN_H,
      size: 1.5 + Math.random() * 6.5,
      opacity: 0.3 + Math.random() * 0.6,
      duration: 3000 + Math.random() * 4000,
      delay: Math.random() * 2000,
      driftX: (Math.random() - 0.5) * SCREEN_W * 0.8,
      driftY: (Math.random() - 0.5) * SCREEN_H * 0.8,
      driftDuration: 8000 + Math.random() * 12000,
    })
  }
  return stars
}

const StarItem = memo(({ star }: { star: StarConfig }) => {
  const twinkle = useRef(new Animated.Value(0)).current
  const drift = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // 闪烁动画
    Animated.loop(
      Animated.sequence([
        Animated.delay(star.delay),
        Animated.timing(twinkle, {
          toValue: 1,
          duration: star.duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(twinkle, {
          toValue: 0,
          duration: star.duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    ).start()

    // 全局飘散动画
    Animated.loop(
      Animated.timing(drift, {
        toValue: 1,
        duration: star.driftDuration,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: false,
      })
    ).start()
  }, [twinkle, drift, star])

  const opacity = twinkle.interpolate({
    inputRange: [0, 1],
    outputRange: [star.opacity * 0.2, star.opacity],
  })

  const posX = drift.interpolate({
    inputRange: [0, 1],
    outputRange: [star.x, star.x + star.driftX],
  })
  const posY = drift.interpolate({
    inputRange: [0, 1],
    outputRange: [star.y, star.y + star.driftY],
  })

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: posX,
        top: posY,
        width: star.size,
        height: star.size,
        borderRadius: star.size / 2,
        backgroundColor: '#FFFFFF',
        opacity,
      }}
    />
  )
})

export interface StarfieldProps {
  /**
   * 是否激活星空效果
   */
  active?: boolean
}

/**
 * StarfieldBackground 组件
 * 在任意页面添加粒子星空背景
 */
export const StarfieldBackground = memo<StarfieldProps>(({ active = true }) => {
  const theme = useTheme()
  const enabled = useSettingValue('playDetail.effect.starfield.enabled')
  const stars = useRef(createStars()).current

  if (!active || !enabled) return null

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {stars.map((star, index) => (
        <StarItem key={index} star={star} />
      ))}
    </View>
  )
})
