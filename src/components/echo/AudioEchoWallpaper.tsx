/**
 * AudioEchoWallpaper - 3D 音域回响动态壁纸
 *
 * 波浪形柱状 3D 阵列 + 流星坠落 + 涟漪 + 白色高光扩散
 * 柱子跟随模拟声波起伏,非随机跳动
 */
import React, { memo, useEffect, useRef, useMemo, useState } from 'react'
import { View, Animated, Easing, Dimensions, StyleSheet } from 'react-native'
import { useIsPlay } from '@/store/player/hook'
import { useSettingValue } from '@/store/setting/hook'

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window')

// 3D 波浪网格配置
const COLS = 40
const ROWS = 6
const BAR_SPACING = SCREEN_W / (COLS + 0.5)
const ROW_SPACING = 10
const BAR_WIDTH = BAR_SPACING * 0.6
const BAR_MAX_HEIGHT = SCREEN_H * 0.13

// ========== 波浪动画控制器 ==========
const WaveController = memo(({ isPlay, color, speed = 1, amplitude = 1 }: { isPlay: boolean; color: string; speed?: number; amplitude?: number }) => {
  // 每个柱子一个动画值
  const anims = useRef(
    Array.from({ length: COLS * ROWS }, () => new Animated.Value(0))
  ).current
  const timeRef = useRef(0)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    // 使用 requestAnimationFrame 驱动平滑波浪
    const animate = () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)

      const animSpeed = isPlay ? (speed * 1.2) : (speed * 0.4)
      timeRef.current += 0.015 * speed

      const t = timeRef.current

      anims.forEach((a, i) => {
        const col = i % COLS
        const row = Math.floor(i / COLS)

        // 核心波浪公式:多个正弦波叠加
        let wave: number

        if (isPlay) {
          // 杂乱有序:每根柱子独立相位 + 叠加波
          const phaseOffset = (col * 0.37 + row * 0.73) % (Math.PI * 2)
          const fastWave = Math.sin(t * 2.0 + phaseOffset) * 0.4
          const midWave = Math.sin(t * 1.2 - col * 0.19 + row * 0.31) * 0.35
          const slowWave = Math.sin(t * 0.6 + col * 0.11) * 0.25
          // 随机种子让柱子高度不同
          const seed = ((col * 17 + row * 31) % 100) * 0.003 + 0.5
          // 前排弹更高,后排略低
          const rowBoost = 1 + (ROWS - row) * 0.08
          // 左右分离
          const stereo = Math.sin(col / COLS * Math.PI) * 0.2
          wave = (fastWave + midWave + slowWave + stereo) * 0.7 * (amplitude || 1) + seed * 0.3
          wave *= rowBoost * (1.3 * (amplitude || 1))
        } else {
          // 暂停时:每个柱子独立呼吸
          const phaseCol = col * 0.23 + row * 0.47
          wave = Math.sin(t * 0.4 + phaseCol) * 0.12 + 0.15
        }

        // 平滑过渡
        Animated.timing(a, {
          toValue: isNaN(wave) ? 0 : Math.min(Math.max(wave, 0), 1),
          duration: 30,
          useNativeDriver: false,
        }).start()
      })

      frameRef.current = requestAnimationFrame(animate)
    }

    animate()
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      anims.forEach(a => a.stopAnimation())
    }
  }, [isPlay])



  // ========== 渲染柱子 ==========
  const renderBars = () => {
    const bars = []
    // 从后往前渲染(后排先渲染,实现透视遮挡)
    for (let r = ROWS - 1; r >= 0; r--) {
      for (let c = 0; c < COLS; c++) {
        const idx = r * COLS + c
        const a = anims[idx]

        const depthScale = 1 - r * 0.08
        const baseX = (c + 0.5) * BAR_SPACING
        const yOffset = r * ROW_SPACING * 1.5
        const colOffset = (c / COLS - 0.5) * r * 6

        const height = a.interpolate({
          inputRange: [0, 1],
          outputRange: [1.5 * depthScale, BAR_MAX_HEIGHT * depthScale],
        })

        const barOpacity = a.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.05 * depthScale, 0.2 * depthScale, 0.5 * depthScale],
        })

        // 白色高光:柱子越高峰值越亮
        const whiteGlow = a.interpolate({
          inputRange: [0.6, 1],
          outputRange: [0.3, 1],
        })

        bars.push(
          <View
            key={`${r}-${c}`}
            style={{
              position: 'absolute',
              left: baseX + colOffset,
              bottom: yOffset,
              width: BAR_WIDTH * depthScale,
              height: BAR_MAX_HEIGHT * 1.2,
              transform: [{ perspective: 500 }, { rotateX: '-60deg' }],
            }}
          >
            {/* 柱体 - 使用颜色 */}
            <Animated.View
              style={{
                position: 'absolute',
                bottom: 0,
                width: '100%',
                height,
                backgroundColor: color,
                opacity: barOpacity,
                borderTopLeftRadius: 2,
                borderTopRightRadius: 2,
              }}
            />
            {/* 白色高光顶面 */}
            <Animated.View
              style={{
                position: 'absolute',
                bottom: height as any,
                width: '100%',
                height: 4,
                backgroundColor: '#fff',
                opacity: whiteGlow,
                borderTopLeftRadius: 2,
                borderTopRightRadius: 2,
                shadowColor: '#fff',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 6,
                elevation: 4,
              }}
            />
          </View>
        )
      }
    }
    return bars
  }



  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {renderBars()}


    </View>
  )
})

// ========== 流星 ==========
const MeteorItem = memo(({ delay, duration, startX, angle, color }: {
  delay: number; duration: number; startX: number; angle: number; color: string
}) => {
  const anim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(anim, { toValue: 1, duration, easing: Easing.out(Easing.ease), useNativeDriver: false }),
      Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: false }),
    ])).start()
  }, [])

  const tx = anim.interpolate({ inputRange: [0, 1], outputRange: [startX, startX + 100] })
  const ty = anim.interpolate({ inputRange: [0, 1], outputRange: [-20, SCREEN_H * 0.6] })
  const o = anim.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 1, 0.6, 0] })

  return (
    <View style={{ position: 'absolute' }}>
      <Animated.View style={{
        left: tx, top: ty,
        width: 4, height: 4, borderRadius: 2,
        backgroundColor: '#fff', opacity: o,
        shadowColor: '#fff', shadowOpacity: 1, shadowRadius: 8, elevation: 6,
      }} />
    </View>
  )
})

const MeteorShower = memo(() => {
  const meteors = useMemo(() => Array.from({ length: 4 }, (_, i) => ({
    delay: i * 2000 + Math.random() * 1500,
    duration: 800 + Math.random() * 400,
    startX: Math.random() * SCREEN_W * 0.8 + SCREEN_W * 0.1,
    angle: -0.2 - Math.random() * 0.5,
  })), [])
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {meteors?.map((m, i) => <MeteorItem key={i} {...m} color='#fff' />)}
    </View>
  )
})

// ========== 涟漪 ==========


// ========== 主组件 ==========
export interface AudioEchoProps {
  enabled?: boolean
  primaryColor?: string
}

export const AudioEchoWallpaper = memo<AudioEchoProps>(({ enabled: _enabled, primaryColor: _primaryColor }) => {
  const isPlay = useIsPlay()
  const settingEnabled = useSettingValue('playDetail.effect.echo.enabled')
  const echoColor = useSettingValue('playDetail.effect.echo.color')
  const enabled = _enabled ?? settingEnabled
  const color = echoColor || _primaryColor || '#6366f1'

  if (!enabled) return null

  return (
    <View style={{ width: '100%', height: SCREEN_H * 0.2 }} pointerEvents="none">
      <WaveController isPlay={isPlay} color={color} />
      <MeteorShower />

    </View>
  )
})
