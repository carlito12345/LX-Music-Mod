/**
 * MusicFree 风格播放器布局 — Neri风格 CoverLyrics
 * - 封面底部叠加歌词(半透明渐变遮罩)
 * - 点击切换全屏歌词
 * - 左右滑动切歌
 */
import { memo, useState, useMemo, useRef, useEffect } from 'react'
import { View, StyleSheet, Dimensions, Image, Pressable, PanResponder } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import { usePlayerMusicInfo } from '@/store/player/hook'
import Text from '@/components/common/Text'
import AppImage from '@/components/common/Image'
import Header from '../components/Header'
import Lyric from '../Lyric'
import MusicFreePlayer from './MusicFreePlayer'
import { playNext, playPrev } from '@/core/player/player'
import { getContrastTextColor, getSecondaryTextColor } from '@/utils/colorContrast'
import { StarfieldBackground } from '@/components/starfield/StarfieldBackground'
import { AudioEchoWallpaper } from '@/components/echo/AudioEchoWallpaper'
import { SpectrumBars } from '@/components/echo/SpectrumBars'
import { WallpaperView } from '@/components/wallpaper/WallpaperView'
import { SlideshowBg } from '@/components/slideshow/SlideshowBg'

const { width: SW, height: SH } = Dimensions.get('window')
const COVER_SIZE = Math.min(SW * 0.6, SH * 0.35)
const PADDING_H = Math.min(SW * 0.04, 60)

interface Props { componentId: string }

// CoverLyrics 使用 store.lastLyric(由 lyricPlayer 自动更新)

export default memo(({ componentId }: Props) => {
  const theme = useTheme()
  const mi = usePlayerMusicInfo()
  const [showLyrics, setShowLyrics] = useState(false)
  const [currentLine, setCurrentLine] = useState('')
  useEffect(() => {
    const tick = () => {
      try {
        const ps = require('@/store/player/state').default
        const offset = (() => { try { return require('@/store/setting/state').default?.setting?.['miniPlayer.lyricOffsetMs'] || 0 } catch { return 0 } })()
        const line = ps?.lastLyric || ''
        setCurrentLine(prev => prev === line ? prev : line)
      } catch {}
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])
  const bgType = useSettingValue('playDetail.background.type')
  const solidColor = useSettingValue('playDetail.background.solidColor') || '#1a1a2e'
  const wallpaperEnabled = useSettingValue('playDetail.effect.wallpaper.enabled')
  const echoEnabled = useSettingValue('playDetail.effect.echo.enabled')
  const spectrumEnabled = useSettingValue('playDetail.effect.spectrum.enabled')
  const starfieldEnabled = useSettingValue('playDetail.effect.starfield.enabled')
  const slideshowEnabled = useSettingValue('playDetail.effect.slideshow.enabled')

  const coverUrl = mi?.pic
  const title = mi?.name || ''
  const artist = mi?.singer || ''

  const bgColor = useMemo(() => {
    if (wallpaperEnabled || slideshowEnabled) return '#1a1a2e'
    if (bgType === 'solid') return solidColor
    return theme['c-app-background']
  }, [bgType, solidColor, wallpaperEnabled, slideshowEnabled, theme])

  const textColor = getContrastTextColor(bgColor)
  const secondaryColor = getSecondaryTextColor(bgColor)

  // lastLyric 由 lyricPlayer 自动更新,这里直接读 store

  // 左右滑动切歌
  const swipeRef = useRef({ startX: 0 }).current
  const swipePan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => { swipeRef.startX = e.nativeEvent.pageX },
    onPanResponderRelease: (e) => {
      const dx = e.nativeEvent.pageX - swipeRef.startX
      if (dx > 60) playPrev()
      else if (dx < -60) playNext()
    },
  })).current

  // 全屏歌词
  if (showLyrics) {
    return (
      <View style={[styles.container, { backgroundColor: '#1a1a2e' }]}>
        <Header backgroundColor={'#1a1a2e'} />
        <Pressable style={styles.lyricFull} onPress={() => setShowLyrics(false)}>
          <Lyric />
        </Pressable>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor, paddingHorizontal: PADDING_H }]}>
      {/* 特效层 */}
      {starfieldEnabled && <StarfieldBackground />}
      {echoEnabled && <AudioEchoWallpaper />}
      {spectrumEnabled && <SpectrumBars primaryColor={theme['c-primary']} />}
      {wallpaperEnabled && <WallpaperView />}
      {slideshowEnabled && <SlideshowBg />}

      {/* 模糊封面背景 */}
      {!wallpaperEnabled && !slideshowEnabled && coverUrl ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Image source={{ uri: coverUrl }} style={[StyleSheet.absoluteFill]} resizeMode="cover" blurRadius={50} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.35)' }]} />
        </View>
      ) : null}

      {/* Header */}
      <Header backgroundColor={bgColor} />

      {/* 封面 + CoverLyrics 叠加 */}
      <Pressable style={styles.body} onPress={() => setShowLyrics(true)} {...swipePan.panHandlers}>
        <View style={styles.coverOuter}>
          {/* 封面图 */}
          <View style={styles.coverWrapper}>
            {coverUrl ? (
              <AppImage url={coverUrl} style={styles.cover} resizeMode="cover" />
            ) : (
              <View style={[styles.cover, styles.coverPlaceholder]}>
                <Text size={50} color={theme['c-primary']}>♪</Text>
              </View>
            )}
          </View>

          {/* CoverLyrics 遮罩层 — 底部半透明 + 渐变 */}
          {currentLine ? (
            <View style={styles.coverLyricsOverlay} pointerEvents="none">
              {/* 底部渐变黑底(Neri风格) */}
              <View style={styles.lyricGradient} />
              <View style={styles.lyricTextWrap}>
                <Text style={styles.lyricLine} numberOfLines={2}>
                  {currentLine}
                </Text>
              </View>
            </View>
          ) : null}
        </View>
      </Pressable>

      {/* 控件 */}
      <MusicFreePlayer backgroundColor={bgColor} />
    </View>
  )
})

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'column' },
  body: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverOuter: {
    position: 'relative',
  },
  coverWrapper: {
    width: COVER_SIZE,
    height: COVER_SIZE,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  cover: { width: '100%', height: '100%' },
  coverPlaceholder: {
    backgroundColor: 'rgba(128,128,128,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // CoverLyrics 遮罩层(Neri风格)
  coverLyricsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '36%',
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    overflow: 'hidden',
  },
  lyricGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    opacity: 0.9,
  },
  lyricTextWrap: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    right: 12,
  },
  lyricLine: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    lineHeight: 22,
  },
  lyricFull: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
})
