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
  const mi = usePlayerMusicInfo()
  const isPlay = useIsPlay()
  const lrcInfo = useLrcPlay()
  const sc = useSettingValue('playDetail.background.solidColor')
  const bg = sc || theme['c-content-background'] || '#1a1a2e'
  const tc = getContrastTextColor(bg)
  const name = mi.name || ''
  const singer = mi.singer || ''
  const pic = mi.pic || ''
  const lrcLine = lrcInfo.text || ''

  return (
    <View style={styles.container}>
      <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={20} reducedTransparencyFallbackColor={bg} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: bg, opacity: 0.8 }]} />
      <View style={styles.content}>
        <View style={styles.coverWrap}>
          {pic ? <Image source={{ uri: pic }} style={styles.cover} /> : (
            <View style={[styles.coverPlaceholder, { backgroundColor: tc + '20' }]}>
              <Text size={24} color={tc} style={{ opacity: 0.5 }}>♪</Text>
            </View>
          )}
        </View>
        <View style={styles.infoArea}>
          <Text numberOfLines={1} size={20} color={tc} style={{ fontWeight: '600' }}>{name || ''}</Text>
          <Text numberOfLines={1} size={17} color={tc} style={{ opacity: 0.5 }}>{singer || ''}</Text>
          <Text numberOfLines={1} size={17} color={tc} style={{ opacity: 0.4 }}>{lrcLine || ''}</Text>
        </View>
        <View style={styles.controls}>
          <TouchableOpacity onPress={() => playPrev()} style={styles.btn} activeOpacity={0.6}>
            <Icon name="skip-previous" rawSize={33} color={tc} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => togglePlay()} style={[styles.playBtn, { backgroundColor: tc + '18' }]} activeOpacity={0.6}>
            <Icon name={isPlay ? 'pause-circle' : 'play-circle'} rawSize={42} color={tc} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => playNext()} style={styles.btn} activeOpacity={0.6}>
            <Icon name="skip-next" rawSize={33} color={tc} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: { width: '100%', height: '100%', overflow: 'hidden' },
  content: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingLeft: 18, paddingRight: 18 },
  coverWrap: { width: 84, height: 84, borderRadius: 18, overflow: 'hidden', flexShrink: 0 },
  cover: { width: 84, height: 84, borderRadius: 18 },
  coverPlaceholder: { width: 84, height: 84, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  infoArea: { flex: 1, marginHorizontal: 15, justifyContent: 'center' },
  controls: { flexDirection: 'row', alignItems: 'center', flexShrink: 0, gap: 10 },
  btn: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  playBtn: { width: 66, height: 66, borderRadius: 33, justifyContent: 'center', alignItems: 'center' },
})
