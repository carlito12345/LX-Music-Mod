/**
 * MiniPlayer - 原生悬浮窗里的纯 RN 播放器
 * - 直接读 store,不依赖原生传参
 * - 响应式尺寸适配窗口
 */
import React, { useEffect, useRef, useState } from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet, PanResponder, Dimensions } from 'react-native'
import { getContrastTextColor } from '@/utils/colorContrast'
import { playNext, playPrev, togglePlay } from '@/core/player/player'

const { width: W, height: H } = Dimensions.get('window')
const PAD = 14
const COVER_SZ = Math.min(W * 0.5, H * 0.35, 280)

const formatTime = (ms: number) => {
  const s = Math.floor(Math.max(0, ms) / 1000)
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0')
}

export default function MiniPlayer() {
  const [state, setState] = useState<any>({})
  const mountedRef = useRef(true)

  // 使用 BackgroundTimer (后台不卡顿) + 仅变化时更新
  useEffect(() => {
    let prev = ''
    const update = () => {
      if (!mountedRef.current) return
      try {
        const ps = require('@/store/player/state').default
        const mi = ps?.musicInfo
        if (!mi?.id) return
        const s = JSON.stringify({ n: mi.name, s: mi.singer, c: mi.pic, p: ps.isPlay, t: ps.progress.nowPlayTime, m: ps.progress.maxPlayTime || mi.interval, l: ps.lastLyric || '' })
        if (s === prev) return
        prev = s
        setState({ name: mi.name, singer: mi.singer, cover: mi.pic, isPlay: ps.isPlay, progress: ps.progress.nowPlayTime, maxProgress: ps.progress.maxPlayTime || mi.interval, currentLrc: ps.lastLyric || '' })
      } catch {}
    }
    update()
    const timer = setInterval(update, 1500)
    return () => { mountedRef.current = false; clearInterval(timer) }
  }, [])

  const { name, singer, cover, isPlay, progress, maxProgress, currentLrc } = state
  const ratio = maxProgress > 0 ? Math.min(progress / maxProgress, 1) : 0
  const bgColor = '#1a1a2e'
  const textColor = '#ffffff'

  // Progress bar seek
  const trackRef = useRef<View>(null)
  const doSeek = (x: number) => {
    trackRef.current?.measureInWindow((lx, ly, tw) => {
      if (tw <= 0) { trackRef.current?.measure((_x, _y, _w) => {
          const r = Math.max(0, Math.min(1, x / (_w || 1)))
          const dur = maxProgress || 0; if (dur > 0) try { require('@/plugins/player').setCurrentTime(r * dur) } catch {}
        }); return }
      const r = Math.max(0, Math.min(1, x / tw))
      const dur = maxProgress || 0; if (dur > 0) try { require('@/plugins/player').setCurrentTime(r * dur) } catch {}
    })
  }
  const seekPan = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => doSeek(e.nativeEvent.locationX),
    onPanResponderMove: (e) => doSeek(e.nativeEvent.locationX),
  })

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Top row: cover + title/artist + close */}
      <View style={styles.topRow}>
        {cover ? (
          <Image source={{ uri: cover }} style={styles.cover} resizeMode="cover" />
        ) : (
          <View style={[styles.cover, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
        )}
        <View style={styles.infoCol}>
          <Text style={styles.title} numberOfLines={1}>{name || '未在播放'}</Text>
          <Text style={styles.artist} numberOfLines={1}>{singer}</Text>
        </View>
        <TouchableOpacity onPress={() => { try { require('@/plugins/miniplayer').hide() } catch {} }} style={styles.closeBtn}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Lyrics line */}
      <View style={styles.lrcWrap}>
        <Text style={styles.lrc} numberOfLines={2}>{currentLrc || '♪'}</Text>
      </View>

      {/* Progress bar + time */}
      <View style={styles.progressRow}>
        <Text style={styles.time}>{formatTime(progress)}</Text>
        <View ref={trackRef} style={styles.track} {...seekPan.panHandlers}>
          <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
        </View>
        <Text style={styles.time}>{formatTime(maxProgress)}</Text>
      </View>

      {/* Controls */}
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
    </View>
  )
}

const BTN_SZ = W * 0.1 > 48 ? 48 : W * 0.1
const PLAY_SZ = W * 0.15 > 64 ? 64 : W * 0.15
const TXT_SZ = W * 0.045 > 18 ? 18 : W * 0.045
const ART_SZ = W * 0.035 > 14 ? 14 : W * 0.035
const LRC_SZ = W * 0.035 > 13 ? 13 : W * 0.035
const TIM_SZ = W * 0.03 > 11 ? 11 : W * 0.03
const CTR_ICON = W * 0.06 > 26 ? 26 : W * 0.06
const PLY_ICON = W * 0.07 > 30 ? 30 : W * 0.07
const CTR_GAP = W * 0.08 > 36 ? 36 : W * 0.08
const LRC_H = H * 0.08 > 50 ? 50 : H * 0.08

const styles = StyleSheet.create({
  container: { flex: 1, borderRadius: 16, overflow: 'hidden', padding: PAD },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  cover: { width: COVER_SZ, height: COVER_SZ, borderRadius: 10, marginRight: 12 },
  infoCol: { flex: 1, justifyContent: 'center' },
  title: { color: '#fff', fontSize: TXT_SZ, fontWeight: '700' },
  artist: { color: 'rgba(255,255,255,0.6)', fontSize: ART_SZ, marginTop: 2 },
  closeBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  closeIcon: { fontSize: 18, color: 'rgba(255,255,255,0.5)' },
  lrcWrap: { height: LRC_H, justifyContent: 'center', marginVertical: 6 },
  lrc: { color: 'rgba(255,255,255,0.7)', fontSize: LRC_SZ, textAlign: 'center' },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  time: { color: 'rgba(255,255,255,0.5)', fontSize: TIM_SZ, minWidth: 36, textAlign: 'center' },
  track: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2 },
  fill: { height: 4, backgroundColor: '#fff', borderRadius: 2 },
  controls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: CTR_GAP },
  ctrlBtn: { width: BTN_SZ, height: BTN_SZ, justifyContent: 'center', alignItems: 'center' },
  playBtn: { width: PLAY_SZ, height: PLAY_SZ, borderRadius: PLAY_SZ / 2, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  ctrlIcon: { fontSize: CTR_ICON, color: 'rgba(255,255,255,0.8)' },
  playIcon: { fontSize: PLY_ICON, color: '#fff' },
})
