import { memo } from 'react'
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { BlurView } from '@react-native-community/blur'
import { usePlayerMusicInfo, useIsPlay } from '@/store/player/hook'
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
  const lrcInfo = useLrcPlay()
  
  const name = musicInfo.name || ''
  const singer = musicInfo.singer || ''
  const pic = musicInfo.pic || ''
  const lrcLine = lrcInfo.text || ''

  const bgColor = theme['c-content-background'] || '#1a1a2e'
  const textColor = getContrastTextColor(bgColor)
  const controlColor = getContrastTextColor(bgColor)

  return (
    <View style={styles.container}>
      <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={20} reducedTransparencyFallbackColor={bgColor} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: bgColor, opacity: 0.85 }]} />

      <View style={styles.content}>
        {/* 左列 */}
        <View style={styles.leftCol}>
          <View style={styles.topRow}>
            <View style={styles.coverWrap}>
              {pic ? (
                <Image source={{ uri: pic }} style={styles.cover} />
              ) : (
                <View style={[styles.coverPlaceholder, { backgroundColor: theme['c-primary'] || '#07c556' }]}>
                  <Text size={28} color="#fff">♪</Text>
                </View>
              )}
            </View>
            <View style={styles.infoArea}>
              <Text numberOfLines={1} size={14} color={textColor} style={{ fontWeight: '600' }}>
                {name || '未播放'}
              </Text>
              <Text numberOfLines={1} size={11} color={textColor} style={{ opacity: 0.6, marginTop: 1 }}>
                {singer || ''}
              </Text>
            </View>
          </View>

          {/* 歌词在进度条上方 */}
          <View style={styles.lrcRow}>
            <Text numberOfLines={1} size={11} color={textColor} style={{ opacity: 0.6 }}>
              {lrcLine || '♪'}
            </Text>
          </View>

          <View style={styles.bottomRow}>
            <View style={styles.controls}>
              <TouchableOpacity style={styles.ctrlBtn} onPress={() => playPrev()}>
                <Icon name="prevMusic" size={18} color={controlColor} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.playBtn, { backgroundColor: controlColor + '20' }]} onPress={() => togglePlay()}>
                <Icon name={isPlay ? 'pause' : 'play'} size={24} color={controlColor} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.ctrlBtn} onPress={() => playNext()}>
                <Icon name="nextMusic" size={18} color={controlColor} />
              </TouchableOpacity>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { backgroundColor: controlColor + '80' }]} />
            </View>
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
    borderRadius: 16,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    padding: 10,
  },
  leftCol: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coverWrap: {
    width: 100,
    height: 100,
    borderRadius: 14,
    overflow: 'hidden',
  },
  cover: {
    width: 100,
    height: 100,
    borderRadius: 14,
  },
  coverPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoArea: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  lrcRow: {
    paddingVertical: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ctrlBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(128,128,128,0.3)',
    overflow: 'hidden',
    marginLeft: 6,
  },
  progressFill: {
    width: '30%',
    height: '100%',
    borderRadius: 1.5,
  },
})
