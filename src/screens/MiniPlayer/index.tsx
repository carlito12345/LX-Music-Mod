import { memo, useState, useCallback } from 'react'
import { View, StyleSheet, TouchableOpacity, Image, LayoutChangeEvent } from 'react-native'
import { BlurView } from '@react-native-community/blur'
import { usePlayerMusicInfo, useIsPlay } from '@/store/player/hook'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import { playNext, playPrev, togglePlay } from '@/core/player/player'
import { useLrcPlay } from '@/plugins/lyric'
import { getContrastTextColor } from '@/utils/colorContrast'

const SIZES = {
  // 所有数值基于容器宽度 W 的比例,确保永远不溢出
  W_RATIO: {
    coverSize: 0.08,        // 封面 = W * 0.08
    coverRadius: 0.018,
    iconSize: 0.025,         // 图标 = W * 0.025
    playSize: 0.042,         // 播放键 = W * 0.042
    padH: 0.015,             // 水平内边距 = W * 0.015
    ctrlGap: 0.008,
    titleSize: 0.018,
    subSize: 0.014,
  }
}

export default memo(() => {
  const theme = useTheme()
  const musicInfo = usePlayerMusicInfo()
  const isPlay = useIsPlay()
  const lrcInfo = useLrcPlay()
  const [containerW, setContainerW] = useState(400)

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width
    if (w > 0) setContainerW(w)
  }, [])

  const W = containerW
  const s = {
    coverSize: W * SIZES.W_RATIO.coverSize,
    coverRadius: W * SIZES.W_RATIO.coverRadius,
    iconSize: W * SIZES.W_RATIO.iconSize,
    playSize: W * SIZES.W_RATIO.playSize,
    padH: W * SIZES.W_RATIO.padH,
    ctrlGap: W * SIZES.W_RATIO.ctrlGap,
    titleSize: W * SIZES.W_RATIO.titleSize,
    subSize: W * SIZES.W_RATIO.subSize,
  }

  const name = musicInfo.name || ''
  const singer = musicInfo.singer || ''
  const pic = musicInfo.pic || ''
  const lrcLine = lrcInfo.text || ''
  const solidColor = useSettingValue('playDetail.background.solidColor')
  const bgColor = solidColor || theme['c-content-background'] || '#1a1a2e'
  const textColor = getContrastTextColor(bgColor)

  return (
    <View style={styles.container} onLayout={onLayout}>
      <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={20} reducedTransparencyFallbackColor={bgColor} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: bgColor, opacity: 0.8 }]} />

      <View style={[styles.content, { paddingHorizontal: s.padH }]}>
        <View style={[styles.coverWrap, { width: s.coverSize, height: s.coverSize, borderRadius: s.coverRadius }]}>
          {pic ? (
            <Image source={{ uri: pic }} style={[styles.cover, { borderRadius: s.coverRadius }]} />
          ) : (
            <View style={[styles.coverPlaceholder, { borderRadius: s.coverRadius, backgroundColor: textColor + '20' }]}>
              <Text size={s.coverSize * 0.35} color={textColor} style={{ opacity: 0.5 }}>♪</Text>
            </View>
          )}
        </View>

        <View style={styles.midArea}>
          <Text numberOfLines={1} size={s.titleSize} color={textColor} style={{ fontWeight: '600' }}>
            {name || '未播放'}
          </Text>
          <Text numberOfLines={1} size={s.subSize} color={textColor} style={{ opacity: 0.5, marginTop: 1 }}>
            {singer || ''}
          </Text>
          <Text numberOfLines={1} size={s.subSize} color={textColor} style={{ opacity: 0.4, marginTop: 2 }}>
            {lrcLine || '♪'}
          </Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={[styles.ctrlBtn, { width: s.playSize * 1.0, height: s.playSize * 1.0, borderRadius: s.playSize * 0.5 }]} onPress={() => playPrev()} activeOpacity={0.6}>
            <Icon name="skip-previous" size={s.iconSize} color={textColor} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.playBtn, { width: s.playSize, height: s.playSize, borderRadius: s.playSize / 2, backgroundColor: textColor + '18' }]} onPress={() => togglePlay()} activeOpacity={0.6}>
            <Icon name={isPlay ? 'pause-circle' : 'play-circle'} size={s.playSize * 0.7} color={textColor} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.ctrlBtn, { width: s.playSize * 1.0, height: s.playSize * 1.0, borderRadius: s.playSize * 0.5 }]} onPress={() => playNext()} activeOpacity={0.6}>
            <Icon name="skip-next" size={s.iconSize} color={textColor} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: { width: '100%', height: '100%', overflow: 'hidden' },
  content: { flex: 1, flexDirection: 'row', alignItems: 'center', position: 'relative' },
  coverWrap: { flexShrink: 0, overflow: 'hidden', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
  cover: { width: '100%', height: '100%' },
  coverPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  midArea: { flex: 1, marginHorizontal: 8, justifyContent: 'center' },
  controls: { flexDirection: 'row', alignItems: 'center', position: 'absolute', right: 12, top: 0, bottom: 0 },
  ctrlBtn: { justifyContent: 'center', alignItems: 'center', overflow: 'visible' },
  playBtn: { justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
})
