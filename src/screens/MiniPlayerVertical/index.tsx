import { memo, useMemo } from 'react'
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native'
import { BlurView } from '@react-native-community/blur'
import { usePlayerMusicInfo, useIsPlay, useProgress } from '@/store/player/hook'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
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
  const bgColor = theme['c-content-background'] || '#1a1a2e'
  const textColor = getContrastTextColor(bgColor)

  return (
    <View style={styles.container}>
      <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={25} reducedTransparencyFallbackColor={bgColor} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: bgColor, opacity: 0.8 }]} />

      <View style={styles.content}>
        {/* 顶部:封面 */}
        <View style={styles.coverWrap}>
          {pic ? (
            <Image source={{ uri: pic }} style={styles.cover} />
          ) : (
            <View style={[styles.coverPlaceholder, { backgroundColor: theme['c-primary'] || '#07c556' }]}>
              <Text size={42} color="#fff">♪</Text>
            </View>
          )}
        </View>

        {/* 歌曲信息 */}
        <View style={styles.infoArea}>
          <Text numberOfLines={1} size={17} color={textColor} style={{ fontWeight: '600', textAlign: 'center' }}>
            {name || '未播放'}
          </Text>
          <Text numberOfLines={1} size={14} color={textColor} style={{ textAlign: 'center', opacity: 0.5, marginTop: 2 }}>
            {singer || ''}
          </Text>
        </View>

        {/* 中间:歌词(占用空间) */}
        <View style={styles.lyricArea}>
          <Text numberOfLines={3} size={15} color={textColor} style={{ textAlign: 'center', opacity: 0.6 }}>
            {lrcLine || '♪ 音乐 ♪'}
          </Text>
        </View>

        {/* 进度条 */}
        <View style={styles.progressWrap}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: maxPlayTime > 0 ? (progress / maxPlayTime * 100) + '%' : '0%' }]} />
          </View>
        </View>

        {/* 底部:控制按钮 */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.btn} onPress={() => playPrev()}>
            <Icon name="prevMusic" size={28} color={textColor} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.playBtn, { backgroundColor: textColor + '20' }]} onPress={() => togglePlay()}>
            <Icon name={isPlay ? 'pause' : 'play'} size={40} color={textColor} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={() => playNext()}>
            <Icon name="nextMusic" size={28} color={textColor} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  coverWrap: {
    width: 180,
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cover: {
    width: 180,
    height: 180,
    borderRadius: 20,
  },
  coverPlaceholder: {
    width: 180,
    height: 180,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoArea: {
    marginTop: 4,
    alignItems: 'center',
  },
  lyricArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginVertical: 8,
  },
  progressWrap: {
    width: '100%',
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  progressBar: {
    width: '100%',
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(128,128,128,0.3)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  btn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
