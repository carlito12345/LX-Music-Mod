import { memo, useState, useRef, useMemo, useEffect, useCallback } from 'react'
import { View, AppState, StyleSheet, Image, Animated, NativeModules, PanResponder, Dimensions } from 'react-native'
import { BlurView } from '@react-native-community/blur'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'

import { pop, navigations } from '@/navigation'
import Header from './components/Header'
import Player from './Player'
import Pic from './Pic'
import Lyric from './Lyric'
import { screenkeepAwake, screenUnkeepAwake } from '@/utils/nativeModules/utils'
import commonState, { type InitState as CommonState } from '@/store/common/state'
import { createStyle } from '@/utils/tools'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { useEntryAnimation, useBackgroundCrossfade } from '@/components/cinematic/CinematicTransition'
import { CoverEnhance } from '@/components/coverenhance/CoverEnhance'
import { StarfieldBackground } from '@/components/starfield/StarfieldBackground'
import { WallpaperView } from '@/components/wallpaper/WallpaperView'
import { SlideshowBg } from '@/components/slideshow/SlideshowBg'
import { AudioEchoWallpaper } from '@/components/echo/AudioEchoWallpaper'
import { SpectrumBars } from '@/components/echo/SpectrumBars'


export default memo(({ componentId }: { componentId: string }) => {
  const mi = usePlayerMusicInfo()
  const theme = useTheme()
  const cinematicEnabled = useSettingValue('playDetail.effect.cinematic.enabled')
  const spectrumEnabled = useSettingValue('playDetail.effect.spectrum.enabled')
  const coverStyle = useSettingValue('playDetail.cover.style')
  const whiteParticlesEnabled = useSettingValue('playDetail.effect.whiteParticles.enabled')
  const blurMaskEnabled = useSettingValue('playDetail.effect.blurMask.enabled')
  const slideshowEnabled = useSettingValue('playDetail.effect.slideshow.enabled')
  const { scaleAnim, opacityAnim } = useEntryAnimation([mi.pic])
  const bgFadeAnim = useBackgroundCrossfade([mi.pic])
  const showLyricRef = useRef(true)
  
  const bgType = useSettingValue('playDetail.background.type')
  const solidColor = useSettingValue('playDetail.background.solidColor')
  const followCover = useSettingValue('playDetail.background.followCover')
  const blurRadius = useSettingValue('playDetail.background.blurRadius')

  // 提取封面主色
  const [dominantColor, setDominantColor] = useState<string>('#1a1a2e')
  useEffect(() => {
    if (bgType !== 'solid' || !followCover || !mi.pic) return
    NativeModules.PaletteModule?.getDominantColor(mi.pic).then((color: string) => {
      setDominantColor(color)
    }).catch(() => {})
  }, [mi.pic, bgType, followCover])

  // 歌词始终可见,保持唤醒
  useEffect(() => {
    screenkeepAwake()

    let appstateListener = AppState.addEventListener('change', (state) => {
      switch (state) {
        case 'active':
          if (!commonState.componentIds.comment) screenkeepAwake()
          break
        case 'background':
          screenUnkeepAwake()
          break
      }
    })

    const handleComponentIdsChange = (ids: CommonState['componentIds']) => {
      if (ids.comment) screenUnkeepAwake()
      else if (AppState.currentState == 'active') screenkeepAwake()
    }

    global.state_event.on('componentIdsUpdated', handleComponentIdsChange)

    return () => {
      global.state_event.off('componentIdsUpdated', handleComponentIdsChange)
      appstateListener.remove()
      screenUnkeepAwake()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 根据背景类型决定背景样式
  const wallpaperEnabled = useSettingValue('playDetail.effect.wallpaper.enabled')
  const backgroundStyle = useMemo(() => {
    if (wallpaperEnabled) {
      return { backgroundColor: 'transparent' }
    }
    if (bgType === 'solid') {
      return { backgroundColor: followCover ? dominantColor : solidColor }
    }
    return { backgroundColor: solidColor || '#1a1a2e' }
  }, [bgType, solidColor, followCover, dominantColor, theme, wallpaperEnabled])

  // 用于对比度计算的实际背景色(不考虑透明效果)
  const contrastBgColor = useMemo(() => {
    // 壁纸模式:使用深色背景
    if (wallpaperEnabled) {
      return '#1a1a2e'
    }
    // 幻灯片模式:使用深色背景
    if (slideshowEnabled) {
      return '#1a1a2e'
    }
    // 模糊模式:使用封面主色或深色
    if (bgType === 'blur') {
      return followCover ? dominantColor : '#1a1a2e'
    }
    // 纯色模式:使用对应颜色
    if (bgType === 'solid') {
      return followCover ? dominantColor : solidColor
    }
    // 跟随主题: 将主题背景色转为可用的对比色
    if (bgType === 'theme') {
      const themeBg = theme['c-content-background'] || '#FFFFFF'
      // 如果是 rgb 格式,转为 hex
      if (themeBg.startsWith('rgb')) {
        const match = themeBg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
        if (match) {
          const r = parseInt(match[1])
          const g = parseInt(match[2])
          const b = parseInt(match[3])
          return '#' + [r,g,b].map(x => x.toString(16).padStart(2,'0')).join('')
        }
      }
      // 如果是 rgba 格式,提取 rgb 部分
      if (themeBg.startsWith('rgba')) {
        const match = themeBg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
        if (match) {
          const r = parseInt(match[1])
          const g = parseInt(match[2])
          const b = parseInt(match[3])
          return '#' + [r,g,b].map(x => x.toString(16).padStart(2,'0')).join('')
        }
      }
      return themeBg
    }
    // 默认使用深色
    return '#1a1a2e'
  }, [wallpaperEnabled, slideshowEnabled, bgType, followCover, dominantColor, solidColor, theme])

  // 右滑返回,左滑展开播放列表
  const SWIPE_THRESHOLD = 80
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 30 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          // 右滑 → 返回主页
          void pop(commonState.componentIds.playDetail!)
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          // 左滑 → 展开播放队列
          const playDetailId = commonState.componentIds.playDetail
          if (playDetailId) {
            navigations.pushPlayQueueScreen(playDetailId)
          }
        }
      },
    })
  ).current

  return (
    <View style={[styles.wrapper, backgroundStyle]} {...panResponder.panHandlers}>
      {/* 高斯模糊背景层 */}
      {bgType === 'blur' && mi.pic && !wallpaperEnabled && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Animated.Image
            source={{ uri: mi.pic }}
            style={[StyleSheet.absoluteFill, cinematicEnabled ? { opacity: bgFadeAnim } : {}]}
            resizeMode="cover"
            blurRadius={blurRadius}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]} />
        </View>
      )}
      {/* 粒子星空背景 */}
      <StarfieldBackground active={true} />
      {/* 星云壁纸 - 在模糊层之上,全屏沉浸 */}
      <WallpaperView />
      {/* 幻灯片背景 */}
      <SlideshowBg />
      {spectrumEnabled && <SpectrumBars primaryColor={theme['c-primary']} />}
      <Header backgroundColor={contrastBgColor} />
      <View style={styles.container}>
        <Animated.View style={[styles.picArea, cinematicEnabled ? { opacity: opacityAnim, transform: [{ scale: scaleAnim }] } : {}]}>
          {coverStyle !== 'hidden' && <Pic componentId={componentId} />}
        </Animated.View>
        <View style={styles.lyricArea}>
          <Lyric backgroundColor={contrastBgColor} />
        </View>
      </View>
      <AudioEchoWallpaper />
      <Player backgroundColor={contrastBgColor} />
    </View>
  )
})

const styles = createStyle({
  wrapper: {
    flex: 1,
    flexDirection: 'column',
  },
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  picArea: {
    flex: 0,
    height: '55%',
  },
  lyricArea: {
    flex: 1,
  },
})
