/**
 * MusicFree 风格播放器布局
 */
import { memo } from 'react'
import { View, StyleSheet, Dimensions, Image } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import { usePlayerMusicInfo } from '@/store/player/hook'
import Text from '@/components/common/Text'
import Header from '../components/Header'
import Player from '../Player'
import Lyric from '../Lyric'
import FastImage from 'react-native-fast-image'

const { width: SCREEN_W } = Dimensions.get('window')

export default memo(({ componentId }: { componentId: string }) => {
  const theme = useTheme()
  const mi = usePlayerMusicInfo()
  const bgColor = useSettingValue('playDetail.background.solidColor') || '#1a1a2e'

  const coverUrl = mi?.pic || ''
  const title = mi?.name || ''
  const artist = mi?.singer || ''

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* 模糊背景 */}
      {coverUrl ? (
        <Image
          source={{ uri: coverUrl }}
          style={StyleSheet.absoluteFill}
          blurRadius={80}
          opacity={0.3}
        />
      ) : null}

      <Header componentId={componentId} />

      <View style={styles.body}>
        {/* 封面区域 */}
        <View style={styles.coverArea}>
          <View style={styles.coverWrapper}>
            {coverUrl ? (
              <FastImage
                source={{ uri: coverUrl, priority: FastImage.priority.high }}
                style={styles.cover}
              />
            ) : (
              <View style={[styles.cover, styles.coverPlaceholder, { backgroundColor: theme['c-primary-alpha-300'] }]}>
                <Text size={40} color={theme['c-primary']}>♪</Text>
              </View>
            )}
          </View>
        </View>

        {/* 歌曲信息 */}
        <View style={styles.infoArea}>
          <Text size={18} numberOfLines={1} style={styles.title}>{title || '未在播放'}</Text>
          <Text size={14} color="#aaa" numberOfLines={1} style={styles.artist}>{artist}</Text>
        </View>

        {/* 播放进度 + 控制 */}
        <View style={styles.playerArea}>
          <Player />
        </View>
      </View>

      {/* 底部歌词 */}
      <View style={styles.lyricArea}>
        <Lyric />
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  coverArea: {
    alignItems: 'center',
    marginBottom: 24,
  },
  coverWrapper: {
    width: SCREEN_W * 0.65,
    height: SCREEN_W * 0.65,
    borderRadius: SCREEN_W * 0.325,
    overflow: 'hidden',
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoArea: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
    paddingHorizontal: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 4,
    fontWeight: '600',
  },
  artist: {
    textAlign: 'center',
  },
  playerArea: {
    width: '100%',
    maxHeight: 120,
  },
  lyricArea: {
    height: 160,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
})
