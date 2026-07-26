import { memo, useMemo } from 'react'
import { View, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native'
import { BlurView } from '@react-native-community/blur'
import { usePlayerMusicInfo, useIsPlay } from '@/store/player/hook'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import { playNext, playPrev, togglePlay } from '@/core/player/player'
import { useLrcPlay } from '@/plugins/lyric'
import { getContrastTextColor } from '@/utils/colorContrast'

/** 基于屏幕最小宽度计算缩放尺寸 */
const useResponsive = () => {
  const { width, height } = Dimensions.get('window')
  const base = Math.min(width, height)
  return {
    // 图标大小 = 屏幕最小边的 5%
    iconSize: base * 0.05,
    playSize: base * 0.085,
    // 封面 = 屏幕最小边的 16%
    coverSize: base * 0.16,
    coverRadius: base * 0.035,
    // 内边距 = 屏幕最小边的 3%
    padH: base * 0.03,
    // 控件间距
    ctrlGap: base * 0.012,
    // 字体
    titleSize: base * 0.035,
    subSize: base * 0.028,
    // 容器圆角
    borderRadius: base * 0.045,
  }
}

export default memo(() => {
  const theme = useTheme()
  const musicInfo = usePlayerMusicInfo()
  const isPlay = useIsPlay()
  const lrcInfo = useLrcPlay()
  const s = useResponsive()

  const name = musicInfo.name || ''
  const singer = musicInfo.singer || ''
  const pic = musicInfo.pic || ''
  const lrcLine = lrcInfo.text || ''

  const solidColor = useSettingValue('playDetail.background.solidColor')
  const bgColor = solidColor || theme['c-content-background'] || '#1a1a2e'
  const textColor = getContrastTextColor(bgColor)

  return (
    <View style={[styles.container, { borderRadius: s.borderRadius }]}>
      <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={20} reducedTransparencyFallbackColor={bgColor} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: bgColor, opacity: 0.8 }]} />

      <View style={[styles.content, { paddingHorizontal: s.padH }]}>
        {/* 封面 */}
        <View style={[styles.coverWrap, { 
          width: s.coverSize, height: s.coverSize,
          borderRadius: s.coverRadius,
          marginRight: s.padH
        }]}>
          {pic ? (
            <Image source={{ uri: pic }} style={[styles.cover, { borderRadius: s.coverRadius }]} />
          ) : (
            <View style={[styles.coverPlaceholder, { 
              borderRadius: s.coverRadius,
              backgroundColor: textColor + '20'
            }]}>
              <Text size={s.coverSize * 0.35} color={textColor} style={{ opacity: 0.5 }}>♪</Text>
            </View>
          )}
        </View>

        {/* 信息 */}
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

        {/* 控件 */}
        <View style={[styles.controls, { gap: s.ctrlGap, marginLeft: s.padH * 0.5 }]}>
          <TouchableOpacity style={[styles.ctrlBtn, { width: s.iconSize * 1.6, height: s.iconSize * 1.6, borderRadius: s.iconSize * 0.8 }]} onPress={() => playPrev()} activeOpacity={0.6}>
            <Icon name="skip-previous" size={s.iconSize} color={textColor} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.playBtn, { 
            width: s.playSize, height: s.playSize,
            borderRadius: s.playSize / 2,
            backgroundColor: textColor + '18'
          }]} onPress={() => togglePlay()} activeOpacity={0.6}>
            <Icon name={isPlay ? 'pause-circle' : 'play-circle'} size={s.playSize * 0.75} color={textColor} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.ctrlBtn, { width: s.iconSize * 1.6, height: s.iconSize * 1.6, borderRadius: s.iconSize * 0.8 }]} onPress={() => playNext()} activeOpacity={0.6}>
            <Icon name="skip-next" size={s.iconSize} color={textColor} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: { width: '100%', height: '100%', overflow: 'hidden' },
  content: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  coverWrap: { flexShrink: 0, overflow: 'hidden', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
  cover: { width: '100%', height: '100%' },
  coverPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  midArea: { flex: 1, justifyContent: 'center' },
  controls: { flexDirection: 'row', alignItems: 'center', flexShrink: 0 },
  ctrlBtn: { justifyContent: 'center', alignItems: 'center' },
  playBtn: { justifyContent: 'center', alignItems: 'center' },
})
