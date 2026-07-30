/**
 * MusicFree 风格播放器布局 - 完整版
 */
import { memo, useState, useMemo, useRef } from 'react'
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

export default memo(({ componentId }: Props) => {
  const theme = useTheme()
  const mi = usePlayerMusicInfo()
  const [showLyrics, setShowLyrics] = useState(false)
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

      {/* 封面(点击切换歌词) */}
      <Pressable style={styles.body} onPress={() => setShowLyrics(true)} {...swipePan.panHandlers}>
        <View style={styles.coverWrapper}>
          {coverUrl ? (
            <AppImage url={coverUrl} style={styles.cover} resizeMode="cover" />
          ) : (
            <View style={[styles.cover, styles.coverPlaceholder]}>
              <Text size={50} color={theme['c-primary']}>♪</Text>
            </View>
          )}
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
  coverWrapper: {
    width: COVER_SIZE,
    height: COVER_SIZE,
    borderRadius: 12,
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
  lyricFull: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
})
