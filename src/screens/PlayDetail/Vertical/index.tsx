import { memo, useState, useRef, useMemo, useEffect } from 'react'
import { View, AppState, StyleSheet, Image } from 'react-native'
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


export default memo(({ componentId }: { componentId: string }) => {
  const mi = usePlayerMusicInfo()
  const theme = useTheme()
  const showLyricRef = useRef(true)
  
  const bgType = useSettingValue('playDetail.background.type')
  const solidColor = useSettingValue('playDetail.background.solidColor')
  const followCover = useSettingValue('playDetail.background.followCover')
  const blurRadius = useSettingValue('playDetail.background.blurRadius')

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
      return { backgroundColor: followCover ? theme['c-primary'] : solidColor }
    }
    return { backgroundColor: theme['c-content-background'] }
  }, [bgType, solidColor, followCover, theme])

  return (
    <View style={[styles.wrapper, backgroundStyle]}>
      {/* 高斯模糊背景层 */}
      {bgType === 'blur' && mi.pic && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Image
            source={{ uri: mi.pic }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            blurRadius={blurRadius}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]} />
        </View>
      )}
      <Header />
      <View style={styles.container}>
        <View style={styles.picArea}>
          <Pic componentId={componentId} />
        </View>
        <View style={styles.lyricArea}>
          <Lyric />
        </View>
      </View>
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
