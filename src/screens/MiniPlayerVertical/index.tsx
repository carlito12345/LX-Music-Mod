import { memo } from 'react'
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

export default memo(() => {
  const theme = useTheme()
  const musicInfo = usePlayerMusicInfo()
  const isPlay = useIsPlay()
  const { progress, maxPlayTime } = useProgress()
  const lrcInfo = useLrcPlay()
  const lrcLine = lrcInfo.text || ''
  
  const name = musicInfo.name || ''
  const singer = musicInfo.singer || ''
  const pic = musicInfo.pic || ''

  // 跟随播放器纯色背景
  const solidColor = useSettingValue('playDetail.background.solidColor')
  const bgColor = solidColor || theme['c-content-background'] || '#1a1a2e'
  const textColor = getContrastTextColor(bgColor)

  return (
    <View style={styles.container}>
      {/* 玻璃背景 */}
      <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={30} reducedTransparencyFallbackColor={bgColor} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: bgColor, opacity: 0.75 }]} />

      <View style={styles.content}>
        {/* 上 1/3:封面 + 信息 */}
        <View style={styles.topSection}>
          <View style={styles.coverWrap}>
            {pic ? (
              <Image source={{ uri: pic }} style={styles.cover} />
            ) : (
              <View style={[styles.coverPlaceholder, { backgroundColor: textColor + '20' }]}>
                <Text size={36} color={textColor} style={{ opacity: 0.5 }}>♪</Text>
              </View>
            )}
          </View>
          <Text numberOfLines={1} size={14} color={textColor} style={{ fontWeight: '600', marginTop: 4 }}>
            {name || '未播放'}
          </Text>
          <Text numberOfLines={1} size={11} color={textColor} style={{ opacity: 0.5, marginTop: 1 }}>
            {singer || ''}
          </Text>
        </View>

        {/* 中 1/3:歌词 */}
        <View style={styles.midSection}>
          <Text numberOfLines={3} size={13} color={textColor} style={{ textAlign: 'center', opacity: 0.7, lineHeight: 20 }}>
            {lrcLine || '♪ 聆听音乐的美好 ♪'}
          </Text>
        </View>

        {/* 下 1/3:进度 + 控件 */}
        <View style={styles.botSection}>
          {/* 进度条 */}
          <View style={styles.progressWrap}>
            <View style={[styles.progressBg, { backgroundColor: textColor + '20' }]}>
              <View style={[styles.progressFill, { 
                width: maxPlayTime > 0 ? (progress / maxPlayTime * 100) + '%' : '0%',
                backgroundColor: textColor
              }]} />
            </View>
          </View>

          {/* 控件 */}
          <View style={styles.controls}>
            <TouchableOpacity style={styles.btn} onPress={() => playPrev()} activeOpacity={0.6}>
              <Icon name="skip-previous" size={22} color={textColor} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.playBtn, { backgroundColor: textColor + '18' }]} onPress={() => togglePlay()} activeOpacity={0.6}>
              <Icon name={isPlay ? 'pause-circle' : 'play-circle'} size={38} color={textColor} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.btn} onPress={() => playNext()} activeOpacity={0.6}>
              <Icon name="skip-next" size={22} color={textColor} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverWrap: {
    width: 120,
    height: 120,
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  cover: {
    width: 120,
    height: 120,
    borderRadius: 18,
  },
  coverPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  midSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  botSection: {
    flex: 1,
    justifyContent: 'center',
  },
  progressWrap: {
    width: '100%',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  progressBg: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
