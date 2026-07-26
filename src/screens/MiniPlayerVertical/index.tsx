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
        {/* 封面 - 放大并下移一点 */}
        <View style={styles.coverWrap}>
          {pic ? (
            <Image source={{ uri: pic }} style={styles.cover} />
          ) : (
            <View style={[styles.coverPlaceholder, { backgroundColor: theme['c-primary'] || '#07c556' }]}>
              <Text size={48} color="#fff">♪</Text>
            </View>
          )}
        </View>

        {/* 歌曲信息 */}
        <View style={styles.infoArea}>
          <Text numberOfLines={1} size={16} color={textColor} style={{ fontWeight: '600', textAlign: 'center' }}>
            {name || '未播放'}
          </Text>
          <Text numberOfLines={1} size={13} color={textColor} style={{ textAlign: 'center', opacity: 0.5, marginTop: 1 }}>
            {singer || ''}
          </Text>
        </View>

        {/* 歌词 */}
        <View style={styles.lyricArea}>
          <Text numberOfLines={2} size={14} color={textColor} style={{ textAlign: 'center', opacity: 0.6 }}>
            {lrcLine || '♪ 音乐 ♪'}
          </Text>
        </View>

        {/* 进度条 - 上移 */}
        <View style={styles.progressWrap}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: maxPlayTime > 0 ? (progress / maxPlayTime * 100) + '%' : '0%' }]} />
          </View>
        </View>

        {/* 控制按钮 - 上移 */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.btn} onPress={() => playPrev()}>
            <Icon name="prevMusic" size={26} color={textColor} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.playBtn, { backgroundColor: textColor + '20' }]} onPress={() => togglePlay()}>
            <Icon name={isPlay ? 'pause' : 'play'} size={38} color={textColor} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={() => playNext()}>
            <Icon name="nextMusic" size={26} color={textColor} />
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
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  coverWrap: {
    width: 200,
    height: 200,
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 6,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cover: {
    width: 200,
    height: 200,
    borderRadius: 22,
  },
  coverPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoArea: {
    marginBottom: 4,
    alignItems: 'center',
  },
  lyricArea: {
    marginVertical: 4,
    paddingHorizontal: 8,
  },
  progressWrap: {
    width: '100%',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(128,128,128,0.3)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  btn: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
