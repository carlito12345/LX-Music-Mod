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
  const mi = usePlayerMusicInfo()
  const isPlay = useIsPlay()
  const { progress, maxPlayTime } = useProgress()
  const lrcInfo = useLrcPlay()
  const sc = useSettingValue('playDetail.background.solidColor')
  const bg = sc || theme['c-content-background'] || '#1a1a2e'
  const tc = getContrastTextColor(bg)
  const lrcLine = lrcInfo.text || ''
  const name = mi.name || ''
  const singer = mi.singer || ''
  const pic = mi.pic || ''

  return (
    <View style={styles.container}>
      <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={30} reducedTransparencyFallbackColor={bg} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: bg, opacity: 0.75 }]} />
      <View style={styles.content}>
        <View style={styles.topSection}>
          <View style={styles.coverWrap}>
            {pic ? <Image source={{ uri: pic }} style={styles.cover} /> : (
              <View style={[styles.coverPlaceholder, { backgroundColor: tc + '20' }]}>
                <Text size={48} color={tc} style={{ opacity: 0.5 }}>♪</Text>
              </View>
            )}
          </View>
          <Text numberOfLines={1} size={22} color={tc} style={{ fontWeight: '600', marginTop: 12 }}>{name || ''}</Text>
          <Text numberOfLines={1} size={20} color={tc} style={{ opacity: 0.5 }}>{singer || ''}</Text>
        </View>
        <View style={styles.midSection}>
          <Text numberOfLines={4} size={21} color={tc} style={{ textAlign: 'center', opacity: 0.7, lineHeight: 33 }}>
            {lrcLine || '♪'}
          </Text>
        </View>
        <View style={styles.botSection}>
          <View style={[styles.progressBg, { backgroundColor: tc + '20' }]}>
            <View style={[styles.progressFill, { backgroundColor: tc, width: maxPlayTime > 0 ? (progress / maxPlayTime * 100) + '%' : '0%' }]} />
          </View>
          <View style={styles.controls}>
            <TouchableOpacity onPress={() => playPrev()} style={styles.btn} activeOpacity={0.6}>
              <Icon name="skip-previous" rawSize={39} color={tc} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => togglePlay()} style={[styles.playBtn, { backgroundColor: tc + '18' }]} activeOpacity={0.6}>
              <Icon name={isPlay ? 'pause-circle' : 'play-circle'} rawSize={60} color={tc} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => playNext()} style={styles.btn} activeOpacity={0.6}>
              <Icon name="skip-next" rawSize={39} color={tc} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: { width: '100%', height: '100%', overflow: 'hidden' },
  content: { flex: 1, paddingHorizontal: 24, paddingVertical: 18 },
  topSection: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  coverWrap: { width: 195, height: 195, borderRadius: 30, overflow: 'hidden', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 10 },
  cover: { width: 195, height: 195, borderRadius: 30 },
  coverPlaceholder: { width: 195, height: 195, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  midSection: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8 },
  botSection: { flex: 1, justifyContent: 'center' },
  progressBg: { width: '100%', height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 21 },
  progressFill: { height: '100%', borderRadius: 2 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 },
  btn: { width: 69, height: 69, borderRadius: 35, justifyContent: 'center', alignItems: 'center' },
  playBtn: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center' },
})
