import { memo, useMemo } from 'react'
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native'
import { BlurView } from '@react-native-community/blur'
import { usePlayerMusicInfo, useIsPlay, useProgress } from '@/store/player/hook'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import { playNext, playPrev, togglePlay } from '@/core/player/player'
import { useLrcPlay } from '@/plugins/lyric'
import { getContrastTextColor } from '@/utils/colorContrast'

interface Props {
  windowWidth?: number
  windowHeight?: number
}

const useResponsive = (customBase: number) => {
  const base = customBase
  return {
    coverSize: base * 0.32,
    coverRadius: base * 0.05,
    iconSize: base * 0.06,
    playSize: base * 0.12,
    padH: base * 0.04,
    padV: base * 0.035,
    titleSize: base * 0.038,
    subSize: base * 0.032,
    lyricSize: base * 0.035,
    gap: base * 0.05,
    progressHeight: base * 0.012,
    borderRadius: base * 0.07,
  }
}

export default memo((props: Props = {}) => {
  const theme = useTheme()
  const musicInfo = usePlayerMusicInfo()
  const isPlay = useIsPlay()
  const { progress, maxPlayTime } = useProgress()
  const lrcInfo = useLrcPlay()
  const { windowWidth = 400, windowHeight = 700 } = props
  const base = Math.min(windowWidth, windowHeight)
  const s = useResponsive(base)

  const lrcLine = lrcInfo.text || ''
  const name = musicInfo.name || ''
  const singer = musicInfo.singer || ''
  const pic = musicInfo.pic || ''

  const solidColor = useSettingValue('playDetail.background.solidColor')
  const bgColor = solidColor || theme['c-content-background'] || '#1a1a2e'
  const textColor = getContrastTextColor(bgColor)

  return (
    <View style={[styles.container, { borderRadius: s.borderRadius }]}>
      <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={30} reducedTransparencyFallbackColor={bgColor} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: bgColor, opacity: 0.75 }]} />

      <View style={[styles.content, { paddingHorizontal: s.padH, paddingVertical: s.padV, paddingBottom: s.padV * 1.2 }]}>
        {/* 上 1/3 封面 */}
        <View style={styles.topSection}>
          <View style={[styles.coverWrap, { 
            width: s.coverSize, height: s.coverSize,
            borderRadius: s.coverRadius,
          }]}>
            {pic ? (
              <Image source={{ uri: pic }} style={[styles.cover, { borderRadius: s.coverRadius }]} />
            ) : (
              <View style={[styles.coverPlaceholder, { 
                borderRadius: s.coverRadius,
                backgroundColor: textColor + '20'
              }]}>
                <Text size={s.coverSize * 0.3} color={textColor} style={{ opacity: 0.5 }}>♪</Text>
              </View>
            )}
          </View>
          <Text numberOfLines={1} size={s.titleSize} color={textColor} style={{ fontWeight: '600', marginTop: s.padV * 0.4 }}>
            {name || '未播放'}
          </Text>
          <Text numberOfLines={1} size={s.subSize} color={textColor} style={{ opacity: 0.5, marginTop: 1 }}>
            {singer || ''}
          </Text>
        </View>

        {/* 中 1/3 歌词 */}
        <View style={styles.midSection}>
          <Text numberOfLines={4} size={s.lyricSize} color={textColor} 
            style={{ textAlign: 'center', opacity: 0.7, lineHeight: s.lyricSize * 1.6 }}>
            {lrcLine || '♪ 聆听音乐的美好 ♪'}
          </Text>
        </View>

        {/* 下 1/3 进度 + 控件 */}
        <View style={styles.botSection}>
          <View style={[styles.progressBg, { 
            height: s.progressHeight,
            borderRadius: s.progressHeight / 2,
            backgroundColor: textColor + '20',
            marginBottom: s.gap * 0.8
          }]}>
            <View style={[styles.progressFill, { 
              height: '100%',
              borderRadius: s.progressHeight / 2,
              backgroundColor: textColor,
              width: maxPlayTime > 0 ? (progress / maxPlayTime * 100) + '%' : '0%'
            }]} />
          </View>

          <View style={[styles.controls, { gap: s.gap * 0.5 }]}>
            <TouchableOpacity style={[styles.btn, { width: s.iconSize * 1.8, height: s.iconSize * 1.8, borderRadius: s.iconSize * 0.9 }]} onPress={() => playPrev()} activeOpacity={0.6}>
              <Icon name="skip-previous" size={s.iconSize} color={textColor} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.playBtn, { 
              width: s.playSize, height: s.playSize,
              borderRadius: s.playSize / 2,
              backgroundColor: textColor + '18'
            }]} onPress={() => togglePlay()} activeOpacity={0.6}>
              <Icon name={isPlay ? 'pause-circle' : 'play-circle'} size={s.playSize * 0.7} color={textColor} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, { width: s.iconSize * 1.8, height: s.iconSize * 1.8, borderRadius: s.iconSize * 0.9 }]} onPress={() => playNext()} activeOpacity={0.6}>
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
