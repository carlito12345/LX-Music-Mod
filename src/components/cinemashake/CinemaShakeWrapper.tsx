/**
 * CinemaShakeWrapper - 电影镜头震动包装组件
 * 播放时为内容添加轻微抖动效果
 */
import React, { memo, useRef, useEffect } from 'react'
import { Animated } from 'react-native'
import { useIsPlay } from '@/store/player/hook'
import { useSettingValue } from '@/store/setting/hook'

interface CinemaShakeWrapperProps {
  children: React.ReactNode
}

export const CinemaShakeWrapper = memo<CinemaShakeWrapperProps>(({ children }) => {
  const enabled = useSettingValue('playDetail.effect.cinemaShake.enabled')
  const isPlay = useIsPlay()
  const translateX = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(0)).current
  const rotate = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!enabled || !isPlay) {
      translateX.setValue(0)
      translateY.setValue(0)
      rotate.setValue(0)
      return
    }

    const shake = () => {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(translateX, {
            toValue: -2 + Math.random() * 4,
            duration: 100 + Math.random() * 100,
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(translateY, {
            toValue: -1 + Math.random() * 2,
            duration: 80 + Math.random() * 80,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 80,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(rotate, {
            toValue: -0.3 + Math.random() * 0.6,
            duration: 150 + Math.random() * 100,
            useNativeDriver: true,
          }),
          Animated.timing(rotate, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
      ]).start()
    }

    const interval = setInterval(shake, 3000)
    shake()

    return () => clearInterval(interval)
  }, [enabled, isPlay, translateX, translateY, rotate])

  if (!enabled || !isPlay) return <>{children}</>

  return (
    <Animated.View
      style={{
        flex: 1,
        transform: [
          { translateX },
          { translateY },
          { rotate: rotate.interpolate({
            inputRange: [-1, 1],
            outputRange: ['-1deg', '1deg'],
          }) },
        ],
      }}
    >
      {children}
    </Animated.View>
  )
})
