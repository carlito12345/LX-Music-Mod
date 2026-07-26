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
        {/* 封面 */}
        <View style={styles.coverWrap}>
          {pic ? (
            <Image source={{ uri: pic }} style={styles.cover} />
          ) : (
            <View style={[styles.coverPlaceholder, { backgroundColor: theme['c-primary'] || '#07c556' }]}>
              <Text size={36} color="#fff">♪</Text>
            </View>
          )}
        </View>

        {/* 歌曲信息 */}
        <View style={styles.lyricArea}>
          <Text numberOfLines={2} size={13} color={textColor} style={{ textAlign: 'center', fontWeight: '500' }}>
            {name || '未播放'}
          </Text>
          <Text numberOfLines={1} size={11} color={textColor} style={{ textAlign: 'center', opacity: 0.5, marginTop: 2 }}>
            {singer || ''}
          </Text>
        </View>

        {/* 进度条 */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: maxPlayTime > 0 ? (progress / maxPlayTime * 100) + '%' : '0%' }]} />
        </View>

        {/* 歌词 */}
        <Text numberOfLines={2} size={11} color={textColor} style={{ textAlign: 'center', opacity: 0.6, marginBottom: 8, paddingHorizontal: 4 }}>
          {lrcLine || ''}
        </Text>

        {/* 控制按钮 */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.btn} onPress={() => playPrev()}>
            <Icon name="prevMusic" size={20} color={textColor} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.playBtn, { backgroundColor: textColor + '20' }]} onPress={() => togglePlay()}>
            <Icon name={isPlay ? 'pause' : 'play'} size={30} color={textColor} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={() => playNext()}>
            <Icon name="nextMusic" size={20} color={textColor} />
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
    borderRadius: 20,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  coverWrap: {
    width: 110,
    height: 110,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cover: {
    width: 110,
    height: 110,
    borderRadius: 16,
  },
  progressBar: {
    width: '100%',
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(128,128,128,0.3)',
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  coverPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lyricArea: {
    marginBottom: 8,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  progressArea: {
    width: '100%',
    marginBottom: 8,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
