import { memo } from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { usePlayerMusicInfo } from '@/store/player/hook'
import Text from '@/components/common/Text'
import playerState from '@/store/player/state'
import { useTheme } from '@/store/theme/hook'
import { playNext, playPrev, togglePlay } from '@/core/player/player'

export default memo(() => {
  const theme = useTheme()
  const musicInfo = usePlayerMusicInfo()
  const name = musicInfo.name || '未播放'
  const singer = musicInfo.singer || ''
  const pic = musicInfo.pic || ''
  const isPlay = playerState.isPlay

  return (
    <View style={[styles.container, { backgroundColor: theme['c-content-background'] || '#1a1a2e' }]}>
      <View style={styles.content}>
        <View style={styles.coverContainer}>
          <Text style={styles.coverPlaceholder}>{pic ? '🎵' : '♪'}</Text>
        </View>

        <View style={styles.info}>
          <Text numberOfLines={1} style={styles.title} size={14}>{name}</Text>
          <Text numberOfLines={1} style={styles.artist} size={12} color={theme['c-font-label']}>{singer}</Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.btn} onPress={() => playPrev()}>
            <Text style={styles.btnText}>⏮</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.playBtn} onPress={() => togglePlay()}>
            <Text style={styles.btnText}>{isPlay ? '⏸' : '▶️'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={() => playNext()}>
            <Text style={styles.btnText}>⏭</Text>
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
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    flex: 1,
  },
  coverContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: 'rgba(128,128,128,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverPlaceholder: {
    fontSize: 28,
    opacity: 0.5,
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontWeight: '600',
    marginBottom: 2,
  },
  artist: {},
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(128,128,128,0.15)',
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(64,128,255,0.2)',
  },
  btnText: {
    fontSize: 18,
  },
})
