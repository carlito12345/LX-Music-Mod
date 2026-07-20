/**
 * Pic.tsx - 封面组件
 * 支持多种封面样式(圆形/方形/圆角/黑胶)和特效开关
 * 所有动画使用 useNativeDriver: false 避免 aarch64 崩溃
 * 颜色跟随主题设置
 */
import { useEffect, useMemo, useRef } from 'react'
import { Animated, PanResponder, View, StyleSheet } from 'react-native'
import { createStyle } from '@/utils/tools'
import { usePlayerMusicInfo, useIsPlay } from '@/store/player/hook'
import { useWindowSize } from '@/utils/hooks'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { HEADER_HEIGHT } from './components/Header'
import Image from '@/components/common/Image'
import { useStatusbarHeight } from '@/store/common/hook'
import { playNext, playPrev } from '@/core/player/player'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'

const PARTICLE_COUNT = 30
const SWIPE_THRESHOLD = 60

const rand = (min: number, max: number) => Math.random() * (max - min) + min

interface ParticleConfig {
  x: number
  y: number
  core: number
  halo: number
  duration: number
  delay: number
  twinkle: number
}

const createParticle = (radius: number): ParticleConfig => {
  const angle = rand(0, 360) * (Math.PI / 180)
  const dist = rand(radius * 0.6, radius * 1.6)
  const core = rand(2, 3.5)
  const halo = rand(6, 12)
  const duration = rand(4000, 7000)
  const delay = rand(0, 3000)
  const twinkle = rand(1200, 2500)
  return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, core, halo, duration, delay, twinkle }
}

export default ({ componentId }: { componentId: string }) => {
  const musicInfo = usePlayerMusicInfo()
  const isPlay = useIsPlay()
  const { width: winWidth, height: winHeight } = useWindowSize()
  const statusBarHeight = useStatusbarHeight()
  const theme = useTheme()

  const coverStyle = useSettingValue('playDetail.cover.style')
  const effectGlow = useSettingValue('playDetail.cover.effect.glow')
  const effectParticles = useSettingValue('playDetail.cover.effect.particles')
  const effectRotate = useSettingValue('playDetail.cover.effect.rotate')
  const effectSwipe = useSettingValue('playDetail.cover.effect.swipe')

  const { imgWidth, ringSize, particleRadius, borderRadius } = useMemo(() => {
    const w = Math.min(winWidth * 0.68, (winHeight - statusBarHeight - HEADER_HEIGHT) * 0.38)
    let br: number
    switch (coverStyle) {
      case 'circle': br = w / 2; break
      case 'square': br = 0; break
      case 'rounded': br = w * 0.08; break
      case 'vinyl': br = w / 2; break
      default: br = w / 2
    }
    return { imgWidth: w, ringSize: w + 4, particleRadius: w / 2, borderRadius: br }
  }, [statusBarHeight, winHeight, winWidth, coverStyle])

  // 粒子配置
  const particles = useMemo<ParticleConfig[]>(() => {
    const arr: ParticleConfig[] = []
    for (let i = 0; i < PARTICLE_COUNT; i++) arr.push(createParticle(particleRadius))
    return arr
  }, [particleRadius])

  const particleAnims = useRef(
    Array.from({ length: PARTICLE_COUNT }, () => ({
      x: new Animated.Value(0), y: new Animated.Value(0), opacity: new Animated.Value(0),
    }))
  ).current

  const isActive = useRef(true)
  useEffect(() => {
    if (!isPlay || !effectParticles) return
    isActive.current = true
    const startParticle = (i: number) => {
      const p = particles[i]
      const a = particleAnims[i]
      return Animated.sequence([
        Animated.delay(p.delay),
        Animated.parallel([
          Animated.timing(a.x, { toValue: p.x, duration: p.duration, useNativeDriver: false }),
          Animated.timing(a.y, { toValue: p.y, duration: p.duration, useNativeDriver: false }),
          Animated.sequence([
            Animated.timing(a.opacity, { toValue: rand(0.5, 0.9), duration: 400, useNativeDriver: false }),
            Animated.loop(Animated.sequence([
              Animated.timing(a.opacity, { toValue: rand(0.2, 0.5), duration: p.twinkle / 2, useNativeDriver: false }),
              Animated.timing(a.opacity, { toValue: rand(0.5, 0.9), duration: p.twinkle / 2, useNativeDriver: false }),
            ]), { iterations: Math.floor(p.duration / p.twinkle) }),
            Animated.timing(a.opacity, { toValue: 0, duration: 600, useNativeDriver: false }),
          ]),
        ]),
      ])
    }
    const loopAll = () => {
      if (!isActive.current) return
      const anims = particleAnims.map((_, i) => startParticle(i))
      Animated.parallel(anims).start(() => { if (isActive.current) loopAll() })
    }
    loopAll()
    return () => { isActive.current = false }
  }, [isPlay, effectParticles, particles, particleAnims])

  // 外圈光环呼吸
  const gl = useRef(new Animated.Value(0.25)).current
  useEffect(() => {
    if (!isPlay || !effectGlow) return
    const a = Animated.loop(Animated.sequence([
      Animated.timing(gl, { toValue: 0.65, duration: 2000, useNativeDriver: false }),
      Animated.timing(gl, { toValue: 0.2, duration: 2000, useNativeDriver: false }),
    ]))
    a.start()
    return () => a.stop()
  }, [isPlay, effectGlow, gl])

  // 旋转
  const sp = useRef(new Animated.Value(0)).current
  useEffect(() => {
    if (!effectRotate) { sp.setValue(0); return }
    sp.setValue(0)
    const a = Animated.timing(sp, { toValue: 3600, duration: 90000, useNativeDriver: false })
    a.start()
    return () => a.stop()
  }, [effectRotate, sp])
  const sd = sp.interpolate({ inputRange: [0, 3600], outputRange: ['0deg', '360deg'], extrapolate: 'extend' })

  // 上下滑动切歌
  const touchStart = useRef({ y: 0 })
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, g) => effectSwipe && Math.abs(g.dy) > 10,
    onPanResponderGrant: (_, g) => { touchStart.current.y = g.moveY },
    onPanResponderRelease: (_, g) => {
      if (!effectSwipe) return
      const dy = g.moveY - touchStart.current.y
      if (dy < -SWIPE_THRESHOLD) playNext()
      else if (dy > SWIPE_THRESHOLD) playPrev()
    },
  }), [effectSwipe])

  // 黑胶唱片样式额外元素
  const vinylHole = coverStyle === 'vinyl' && (
    <View style={{
      position: 'absolute',
      width: imgWidth * 0.18,
      height: imgWidth * 0.18,
      borderRadius: imgWidth * 0.09,
      backgroundColor: theme['c-content-background'],
      borderWidth: 2,
      borderColor: theme['c-primary-alpha-400'],
    }} />
  )

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <View style={[styles.inner, { backgroundColor: 'transparent' }]}>
        {/* 外圈光环 */}
        {effectGlow && (
          <Animated.View style={{
            position: 'absolute',
            width: imgWidth + 36, height: imgWidth + 36,
            borderRadius: (imgWidth + 36) / 2,
            borderWidth: 10, borderColor: theme['c-primary'],
            backgroundColor: 'transparent', opacity: gl,
          }} />
        )}
        {/* 星河粒子层 */}
        {effectParticles && particleAnims.map((a, i) => (
          <View key={i} style={{ position: 'absolute' }} pointerEvents="none">
            <Animated.View style={{
              position: 'absolute', width: particles[i].halo, height: particles[i].halo,
              borderRadius: particles[i].halo / 2, backgroundColor: theme['c-primary-alpha-200'],
              opacity: Animated.multiply(a.opacity, 0.25),
              transform: [
                { translateX: Animated.add(a.x, new Animated.Value(-particles[i].halo / 2)) },
                { translateY: Animated.add(a.y, new Animated.Value(-particles[i].halo / 2)) },
              ],
            }} />
            <Animated.View style={{
              position: 'absolute', width: particles[i].core, height: particles[i].core,
              borderRadius: particles[i].core / 2, backgroundColor: theme['c-primary-light-100'],
              opacity: a.opacity,
              transform: [
                { translateX: Animated.add(a.x, new Animated.Value(-particles[i].core / 2)) },
                { translateY: Animated.add(a.y, new Animated.Value(-particles[i].core / 2)) },
              ],
            }} />
          </View>
        ))}
        {/* 封面 */}
        <Animated.View style={{ transform: [{ rotate: effectRotate ? sd : '0deg' }] }}>
          <View style={{
            width: ringSize, height: ringSize, borderRadius: ringSize / 2,
            borderWidth: coverStyle === 'vinyl' ? 3 : 1,
            borderColor: coverStyle === 'vinyl' ? theme['c-primary-alpha-600'] : theme['c-primary-alpha-400'],
            justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent',
          }}>
            <Image
              url={musicInfo.pic}
              nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_pic}
              style={{ width: imgWidth, height: imgWidth, borderRadius }}
            />
            {vinylHole}
          </View>
        </Animated.View>
      </View>
    </View>
  )
}

const styles = createStyle({
  container: { flex: 1 },
  inner: { flex: 1, justifyContent: 'center', alignItems: 'center' },
})
