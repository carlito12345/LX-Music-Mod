/**
 * MiniPlayer — Neri风格毛玻璃
 * - AdvancedGlass 毛玻璃背景
 * - 封面 + 歌名歌手 + 进度条 + 控制按钮
 * - 左右滑动切歌(弹簧回弹)
 * - 自适应屏幕尺寸
 */
import React, { useEffect, useRef, useState } from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet, PanResponder, Animated, Dimensions } from 'react-native'
import { playNext, playPrev, togglePlay } from '@/core/player/player'

const { width: W, height: H } = Dimensions.get('window')
const COVER_SZ = Math.min(W * 0.42, H * 0.28, 240)
const PAD = 14

const formatTime = (ms: number) => {
  const s = Math.floor(Math.max(0, ms) / 1000)
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0')
}

export default function MiniPlayer() {
  const [state, setState] = useState<any>({})
  const swipeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(1)).current
  const mountedRef = useRef(true)

  // 轮询 store(仅变化时更新)
  useEffect(() => {
    let prev = ''
    const tick = () => {
      if (!mountedRef.current) return
      try {
        const ps = require('@/store/player/state').default
        const mi = ps?.musicInfo
        if (!mi?.id) return
        const s = JSON.stringify({ n: mi.name, s: mi.singer, c: mi.pic, p: ps.isPlay, t: ps.progress.nowPlayTime, m: ps.progress.maxPlayTime || mi.interval })
        if (s === prev) return
        prev = s
        setState({ name: mi.name, singer: mi.singer, cover: mi.pic, isPlay: ps.isPlay, progress: ps.progress.nowPlayTime, maxProgress: ps.progress.maxPlayTime || mi.interval })
      } catch {}
    }
    tick()
    const t = setInterval(tick, 1500)
    return () => { mountedRef.current = false; clearInterval(t) }
  }, [])

  const { name, singer, cover, isPlay, progress, maxProgress } = state
  const ratio = maxProgress > 0 ? Math.min(progress / maxProgress, 1) : 0
  const bgColor = '#1a1a2e'

  // 进度条 seek
  const trackRef = useRef<View>(null)
  const doSeek = (x: number) => {
    trackRef.current?.measure((_x, _y, tw) => {
      const r = Math.max(0, Math.min(1, x / (tw || 1)))
      const dur = maxProgress || 0
      if (dur > 0) try { require('@/plugins/player').setCurrentTime(r * dur) } catch {}
    })
  }
  const seekPan = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => doSeek(e.nativeEvent.locationX),
    onPanResponderMove: (e) => doSeek(e.nativeEvent.locationX),
  })

  // 左右滑切歌(Neri风格弹簧动画)
  let dragX = 0
  const swipePan = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { dragX = 0 },
    onPanResponderMove: (_, gs) => {
      // 带阻尼的偏移
      const resisted = Math.sign(gs.dx) * 80 * (1 - Math.exp(-Math.abs(gs.dx) / 80))
      swipeAnim.setValue(resisted)
      scaleAnim.setValue(1 - Math.min(Math.abs(resisted) / 400, 0.04))
      dragX = gs.dx
    },
    onPanResponderRelease: () => {
      if (dragX > 60) {
        Animated.sequence([
          Animated.timing(swipeAnim, { toValue: 180, duration: 100, useNativeDriver: true }),
          Animated.timing(swipeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        ]).start(() => playPrev())
      } else if (dragX < -60) {
        Animated.sequence([
          Animated.timing(swipeAnim, { toValue: -180, duration: 100, useNativeDriver: true }),
          Animated.timing(swipeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        ]).start(() => playNext())
      } else {
        Animated.spring(swipeAnim, { toValue: 0, useNativeDriver: true }).start()
      }
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start()
    },
  })

  return (
    <Animated.View
      style={[styles.container, { backgroundColor: bgColor }, { transform: [{ translateX: swipeAnim }, { scale: scaleAnim }] }]}
      {...swipePan.panHandlers}
    >
      {/* 顶部行:封面 + 歌名歌手 + 关闭 */}
      <View style={styles.topRow}>
        <View style={styles.coverWrap}>
          {cover ? (
            <Image source={{ uri: cover }} style={styles.cover} resizeMode="cover" />
          ) : (
            <View style={[styles.cover, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
          )}
        </View>
        <View style={styles.infoCol}>
          <Text style={styles.title} numberOfLines={1}>{name || '未在播放'}</Text>
          <Text style={styles.artist} numberOfLines={1}>{singer}</Text>
        </View>
        <TouchableOpacity onPress={() => { try { require('@/plugins/miniplayer').hide() } catch {} }} style={styles.closeBtn}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* 进度条 + 时间 */}
      <View style={styles.progressRow}>
        <Text style={styles.time}>{formatTime(progress)}</Text>
        <View ref={trackRef} style={styles.track} {...seekPan.panHandlers}>
          <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
        </View>
        <Text style={styles.time}>{formatTime(maxProgress)}</Text>
      </View>

      {/* 播放控件 */}
      <View style={styles.controls}>
        <TouchableOpacity onPress={() => playPrev()} style={styles.ctrlBtn}>
          <Text style={styles.ctrlIcon}>⏮</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => togglePlay()} style={styles.playBtn}>
          <Text style={styles.playIcon}>{isPlay ? '⏸' : '▶'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => playNext()} style={styles.ctrlBtn}>
          <Text style={styles.ctrlIcon}>⏭</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  )
}

const BTN = Math.min(W * 0.09, 42)
const PLAY = Math.min(W * 0.13, 58)
const FS = Math.min(W * 0.04, 16)

const styles = StyleSheet.create({
  container: {
    flex: 1, borderRadius: 20, overflow: 'hidden',
    paddingHorizontal: PAD + 2, paddingVertical: PAD,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  coverWrap: {
    width: COVER_SZ, height: COVER_SZ, borderRadius: 12, overflow: 'hidden',
    marginRight: 14, elevation: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 8,
  },
  cover: { width: '100%', height: '100%' },
  infoCol: { flex: 1, justifyContent: 'center' },
  title: { color: '#fff', fontSize: Math.min(W * 0.042, 17), fontWeight: '700' },
  artist: { color: 'rgba(255,255,255,0.55)', fontSize: Math.min(W * 0.033, 13), marginTop: 2 },
  closeBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  closeIcon: { fontSize: 18, color: 'rgba(255,255,255,0.45)' },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  time: { color: 'rgba(255,255,255,0.5)', fontSize: Math.min(W * 0.028, 11), minWidth: 36, textAlign: 'center' },
  track: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 2 },
  fill: { height: 4, backgroundColor: '#fff', borderRadius: 2 },
  controls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Math.min(W * 0.07, 32) },
  ctrlBtn: { width: BTN, height: BTN, justifyContent: 'center', alignItems: 'center' },
  playBtn: {
    width: PLAY, height: PLAY, borderRadius: PLAY / 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 6,
  },
  ctrlIcon: { fontSize: Math.min(W * 0.055, 24), color: 'rgba(255,255,255,0.75)' },
  playIcon: { fontSize: Math.min(W * 0.065, 28), color: '#fff' },
})
