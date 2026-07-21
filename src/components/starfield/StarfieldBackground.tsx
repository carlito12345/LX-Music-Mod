/**
 * StarfieldBackground - 粒子星空背景插件
 * 独立插件,不侵入核心功能
 */
import React, { memo, useEffect, useRef } from 'react'
import { View, Animated, Easing, Dimensions, StyleSheet } from 'react-native'
import { useIsPlay } from '@/store/player/hook'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'

const STAR_COUNT = 40
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window')

interface StarConfig {
  x: number
  y: number
  size: number
  opacity: number
  duration: number
  delay: number
}

const createStars = (): StarConfig[] => {
  const stars: StarConfig[] = []
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * SCREEN_W,
      y: Math.random() * SCREEN_H,
      size: 1.5 + Math.random() * 2.5,
      opacity: 0.3 + Math.random() * 0.6,
      duration: 3000 + Math.random() * 4000,
      delay: Math.random() * 2000,
    })
  }
  return stars
}

const StarItem = memo(({ star, primaryColor }: { star: StarConfig; primaryColor: string }) => {
  const twinkle = useRef(new Animated.Value(0)).current

  useEffect(() => {
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
  }, [twinkle, star])

  const opacity = twinkle.interpolate({
    inputRange: [0, 1],
    outputRange: [star.opacity * 0.3, star.opacity],
  })

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: star.x,
        top: star.y,
        width: star.size,
        height: star.size,
        borderRadius: star.size / 2,
        backgroundColor: primaryColor,
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
        <StarItem key={index} star={star} primaryColor={theme['c-primary']} />
      ))}
    </View>
  )
})
