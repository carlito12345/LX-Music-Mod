import { memo, useState, useRef, useMemo, useEffect, useCallback } from 'react'
import { View, AppState, StyleSheet, Image, Animated, NativeModules } from 'react-native'
import { BlurView } from '@react-native-community/blur'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'

import Header from './components/Header'
import Player from './Player'
import Pic from './Pic'
import Lyric from './Lyric'
import { screenkeepAwake, screenUnkeepAwake } from '@/utils/nativeModules/utils'
import commonState, { type InitState as CommonState } from '@/store/common/state'
import { createStyle } from '@/utils/tools'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { useEntryAnimation, useBackgroundCrossfade } from '@/components/cinematic/CinematicTransition'
import { StarfieldBackground } from '@/components/starfield/StarfieldBackground'
import { AudioEchoWallpaper } from '@/components/echo/AudioEchoWallpaper'
import { SpectrumBars } from '@/components/echo/SpectrumBars'


export default memo(({ componentId }: { componentId: string }) => {
  const mi = usePlayerMusicInfo()
  const theme = useTheme()
  const cinematicEnabled = useSettingValue('playDetail.effect.cinematic.enabled')
  const spectrumEnabled = useSettingValue('playDetail.effect.spectrum.enabled')
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
  const backgroundStyle = useMemo(() => {
    if (bgType === 'solid') {
      return { backgroundColor: followCover ? dominantColor : solidColor }
    }
    return { backgroundColor: theme['c-content-background'] }
  }, [bgType, solidColor, followCover, dominantColor, theme])

  return (
    <View style={[styles.wrapper, backgroundStyle]}>
      {/* 高斯模糊背景层 */}
      {bgType === 'blur' && mi.pic && (
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
      {spectrumEnabled && <SpectrumBars primaryColor={theme['c-primary']} />}
      <Header />
      <View style={styles.container}>
        <Animated.View style={[styles.picArea, cinematicEnabled ? { opacity: opacityAnim, transform: [{ scale: scaleAnim }] } : {}]}>
          <Pic componentId={componentId} />
        </Animated.View>
        <View style={styles.lyricArea}>
          <Lyric />
        </View>
      </View>
      <AudioEchoWallpaper />
      <Player />
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
    height: '40%',
  },
  lyricArea: {
    flex: 1,
  },
})
