import { memo, useState, useCallback } from 'react'
import { View, StyleSheet, Image, TouchableOpacity, LayoutChangeEvent } from 'react-native'
import { BlurView } from '@react-native-community/blur'
import { usePlayerMusicInfo, useIsPlay, useProgress } from '@/store/player/hook'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import { playNext, playPrev, togglePlay } from '@/core/player/player'
import { useLrcPlay } from '@/plugins/lyric'
import { getContrastTextColor } from '@/utils/colorContrast'

const getS = (W: number) => ({
  coverSize: W * 0.28,
  coverRadius: W * 0.045,
  iconSize: W * 0.05,
  playSize: W * 0.11,
  padH: W * 0.035,
  padV: W * 0.03,
  titleSize: W * 0.035,
  subSize: W * 0.03,
  lyricSize: W * 0.032,
  gap: W * 0.035,
  progressHeight: W * 0.012,
  borderRadius: W * 0.06,
})

export default memo(() => {
  const theme = useTheme()
  const musicInfo = usePlayerMusicInfo()
  const isPlay = useIsPlay()
  const { progress, maxPlayTime } = useProgress()
  const lrcInfo = useLrcPlay()
  const [containerH, setContainerH] = useState(600)

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height
    if (h > 0) setContainerH(h)
  }, [])

  const s = getS(containerH * 0.55)

  const lrcLine = lrcInfo.text || ''
  const name = musicInfo.name || ''
  const singer = musicInfo.singer || ''
  const pic = musicInfo.pic || ''
  const solidColor = useSettingValue('playDetail.background.solidColor')
  const bgColor = solidColor || theme['c-content-background'] || '#1a1a2e'
  const textColor = getContrastTextColor(bgColor)

  return (
    <View style={styles.container} onLayout={onLayout}>
      <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={30} reducedTransparencyFallbackColor={bgColor} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: bgColor, opacity: 0.75 }]} />

      <View style={[styles.content, { paddingHorizontal: s.padH, paddingVertical: s.padV }]}>
        <View style={styles.topSection}>
          <View style={[styles.coverWrap, { width: s.coverSize, height: s.coverSize, borderRadius: s.coverRadius }]}>
            {pic ? (
              <Image source={{ uri: pic }} style={[styles.cover, { borderRadius: s.coverRadius }]} />
            ) : (
              <View style={[styles.coverPlaceholder, { borderRadius: s.coverRadius, backgroundColor: textColor + '20' }]}>
                <Text size={s.coverSize * 0.25} color={textColor} style={{ opacity: 0.5 }}>♪</Text>
              </View>
            )}
          </View>
          <Text numberOfLines={1} size={s.titleSize} color={textColor} style={{ fontWeight: '600', marginTop: s.padV * 0.3 }}>
            {name || '未播放'}
          </Text>
          <Text numberOfLines={1} size={s.subSize} color={textColor} style={{ opacity: 0.5 }}>{singer || ''}</Text>
        </View>

        <View style={styles.midSection}>
          <Text numberOfLines={3} size={s.lyricSize} color={textColor} style={{ textAlign: 'center', opacity: 0.7, lineHeight: s.lyricSize * 1.5 }}>
            {lrcLine || '♪'}
          </Text>
        </View>

        <View style={styles.botSection}>
          <View style={[styles.progressBg, { height: s.progressHeight, borderRadius: s.progressHeight / 2, backgroundColor: textColor + '20', marginBottom: s.gap }]}>
            <View style={[styles.progressFill, { height: '100%', borderRadius: s.progressHeight / 2, backgroundColor: textColor, width: maxPlayTime > 0 ? (progress / maxPlayTime * 100) + '%' : '0%' }]} />
          </View>
          <View style={[styles.controls, { gap: s.gap * 0.5 }]}>
            <TouchableOpacity style={[styles.btn, { width: s.playSize * 0.8, height: s.playSize * 0.8, borderRadius: s.playSize * 0.4 }]} onPress={() => playPrev()} activeOpacity={0.6}>
              <Icon name="skip-previous" size={s.iconSize} color={textColor} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.playBtn, { width: s.playSize, height: s.playSize, borderRadius: s.playSize / 2, backgroundColor: textColor + '18' }]} onPress={() => togglePlay()} activeOpacity={0.6}>
              <Icon name={isPlay ? 'pause-circle' : 'play-circle'} size={s.playSize * 0.65} color={textColor} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, { width: s.playSize * 0.8, height: s.playSize * 0.8, borderRadius: s.playSize * 0.4 }]} onPress={() => playNext()} activeOpacity={0.6}>
              <Icon name="skip-next" size={s.iconSize} color={textColor} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: { width: '100%', height: '100%', overflow: 'hidden' },
  content: { flex: 1 },
  topSection: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  coverWrap: { flexShrink: 0, overflow: 'hidden', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 10 },
  cover: { width: '100%', height: '100%' },
  coverPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  midSection: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8 },
  botSection: { flex: 1, justifyContent: 'center' },
  progressBg: { width: '100%', overflow: 'hidden' },
  progressFill: {},
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  btn: { justifyContent: 'center', alignItems: 'center' },
  playBtn: { justifyContent: 'center', alignItems: 'center' },
})
