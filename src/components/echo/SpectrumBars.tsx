/**
 * SpectrumBars - 频谱柱状条
 * 优先使用真实频谱数据,不可用时回退到模拟动画
 */
import React, { memo, useEffect, useRef, useCallback, useState } from 'react'
import { View, Animated, Easing, StyleSheet } from 'react-native'
import { useIsPlay } from '@/store/player/hook'
import { startSpectrum, stopSpectrum, onSpectrumData } from '@/plugins/spectrum'

const BAR_COUNT = 16

// 模拟频谱数据(兜底)
const generateSimulatedData = (): number[] => {
  return Array.from({ length: BAR_COUNT }, () => 0.05 + Math.random() * 0.4)
}

export const SpectrumBars = memo(({ primaryColor }: { primaryColor: string }) => {
  const isPlay = useIsPlay()
  const [hasSpectrum, setHasSpectrum] = useState(false)

  // 每个柱子一个动画值
  const barAnims = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.05))
  ).current

  // 启动/停止频谱监听
  useEffect(() => {
    if (!isPlay) {
      setHasSpectrum(false)
      stopSpectrum().catch(() => {})
      return
    }

    let cancelled = false
    startSpectrum().then(success => {
      if (!cancelled) setHasSpectrum(success)
    })

    return () => {
      cancelled = true
      stopSpectrum().catch(() => {})
    }
  }, [isPlay])

  // 频谱数据回调
  useEffect(() => {
    if (!isPlay) return

    const unsubscribe = onSpectrumData((data: number[]) => {
      if (!data || data.length === 0) return

      // 将 32 bins 降采样到 BAR_COUNT
      barAnims.forEach((anim, i) => {
        const srcIdx = Math.floor((i / BAR_COUNT) * data.length)
        const val = data[srcIdx] ?? 0
        Animated.timing(anim, {
          toValue: Math.max(val, 0.05),
          duration: 60,
          useNativeDriver: false,
        }).start()
      })
    })

    return unsubscribe
  }, [isPlay])

  // 回退:无真实频谱时使用模拟数据
  useEffect(() => {
    if (hasSpectrum || !isPlay) return

    let timeoutId: ReturnType<typeof setTimeout>
    const simulate = () => {
      const simData = generateSimulatedData()
      barAnims.forEach((anim, i) => {
        Animated.timing(anim, {
          toValue: simData[i],
          duration: 150 + Math.random() * 100,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }).start()
      })
      timeoutId = setTimeout(simulate, 200 + Math.random() * 200)
    }
    simulate()
    return () => clearTimeout(timeoutId)
  }, [hasSpectrum, isPlay])

  // 暂停时平滑回落
  useEffect(() => {
    if (isPlay) return
    barAnims.forEach(a => {
      Animated.timing(a, {
        toValue: 0.05,
        duration: 300,
        useNativeDriver: false,
      }).start()
    })
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
            style={[styles.bar, {
              height,
              backgroundColor: primaryColor,
              opacity,
            }]}
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
