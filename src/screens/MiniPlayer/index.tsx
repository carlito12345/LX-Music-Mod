import { memo } from 'react'
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { BlurView } from '@react-native-community/blur'
import { usePlayerMusicInfo, useIsPlay } from '@/store/player/hook'
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
  const lrcInfo = useLrcPlay()
  
  const name = musicInfo.name || ''
  const singer = musicInfo.singer || ''
  const pic = musicInfo.pic || ''
  const lrcLine = lrcInfo.text || ''

  const solidColor = useSettingValue('playDetail.background.solidColor')
  const bgColor = solidColor || theme['c-content-background'] || '#1a1a2e'
  const textColor = getContrastTextColor(bgColor)

  return (
    <View style={styles.container}>
      <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={20} reducedTransparencyFallbackColor={bgColor} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: bgColor, opacity: 0.8 }]} />

      <View style={styles.content}>
        {/* 封面 */}
        <View style={styles.coverWrap}>
          {pic ? (
            <Image source={{ uri: pic }} style={styles.cover} />
          ) : (
            <View style={[styles.coverPlaceholder, { backgroundColor: textColor + '20' }]}>
              <Text size={24} color={textColor} style={{ opacity: 0.5 }}>♪</Text>
            </View>
          )}
        </View>

        {/* 信息 + 歌词 */}
        <View style={styles.midArea}>
          <Text numberOfLines={1} size={14} color={textColor} style={{ fontWeight: '600' }}>
            {name || '未播放'}
          </Text>
          <Text numberOfLines={1} size={11} color={textColor} style={{ opacity: 0.5, marginTop: 1 }}>
            {singer || ''}
          </Text>
          <Text numberOfLines={1} size={11} color={textColor} style={{ opacity: 0.4, marginTop: 3 }}>
            {lrcLine || '♪'}
          </Text>
        </View>

        {/* 控件 */}
        <View style={styles.rightArea}>
          <View style={styles.controls}>
            <TouchableOpacity style={styles.ctrlBtn} onPress={() => playPrev()} activeOpacity={0.6}>
              <Icon name="skip-previous" size={20} color={textColor} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.playBtn, { backgroundColor: textColor + '18' }]} onPress={() => togglePlay()} activeOpacity={0.6}>
              <Icon name={isPlay ? 'pause-circle' : 'play-circle'} size={36} color={textColor} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.ctrlBtn} onPress={() => playNext()} activeOpacity={0.6}>
              <Icon name="skip-next" size={20} color={textColor} />
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
    borderRadius: 18,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  coverWrap: {
    width: 72,
    height: 72,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  cover: {
    width: 72,
    height: 72,
    borderRadius: 14,
  },
  coverPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  midArea: {
    flex: 1,
    marginHorizontal: 12,
    justifyContent: 'center',
  },
  rightArea: {
    justifyContent: 'center',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ctrlBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
