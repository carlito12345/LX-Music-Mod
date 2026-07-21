/**
 * SpectrumBars - 频谱柱状条(模拟数据驱动)
 */
import React, { memo, useEffect, useRef, useState } from 'react'
import { View, Animated, Easing, StyleSheet } from 'react-native'
import { useIsPlay } from '@/store/player/hook'

const BAR_COUNT = 16

export const SpectrumBars = memo(({ primaryColor }: { primaryColor: string }) => {
  const isPlay = useIsPlay()
  const barAnims = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.05))
  ).current

  useEffect(() => {
    if (!isPlay) {
      barAnims.forEach(a => {
        Animated.timing(a, { toValue: 0.05, duration: 300, useNativeDriver: false }).start()
      })
      return
    }

    let timeoutId: ReturnType<typeof setTimeout>
    const simulate = () => {
      barAnims.forEach((anim, i) => {
        const target = 0.1 + Math.random() * 0.7
        Animated.timing(anim, {
          toValue: target,
          duration: 150 + Math.random() * 100,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }).start()
      })
      timeoutId = setTimeout(simulate, 180 + Math.random() * 150)
    }
    simulate()
    return () => clearTimeout(timeoutId)
  }, [isPlay])

  return (
    <View style={styles.container} pointerEvents="none">
      {barAnims.map((anim, i) => {
        const height = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [2, 55],
        })
        const opacity = anim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.1, 0.3, 0.7],
        })
        return (
          <Animated.View
            key={i}
            style={[styles.bar, { height, backgroundColor: primaryColor, opacity }]}
          />
        )
      })}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 55,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 55,
  },
  bar: {
    width: 4,
    borderRadius: 2,
    minHeight: 2,
  },
})
