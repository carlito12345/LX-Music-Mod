import { memo, useMemo } from 'react'
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { BlurView } from '@react-native-community/blur'
import { usePlayerMusicInfo, useIsPlay, useThemeColors } from '@/store/player/hook'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { playNext, playPrev, togglePlay } from '@/core/player/player'
import { getContrastTextColor } from '@/utils/colorContrast'

const ControlBtn = memo(({ icon, size, onPress, color }: {
  icon: string; size: number; onPress: () => void; color: string
}) => (
  <TouchableOpacity onPress={onPress} style={styles.ctrlBtn}>
    <Text size={size} color={color}>{icon}</Text>
  </TouchableOpacity>
))

export default memo(() => {
  const theme = useTheme()
  const musicInfo = usePlayerMusicInfo()
  const isPlay = useIsPlay()
  
  const name = musicInfo.name || ''
  const singer = musicInfo.singer || ''
  const pic = musicInfo.pic || ''

  const bgColor = theme['c-content-background'] || '#1a1a2e'
  const textColor = getContrastTextColor(bgColor)
  const controlColor = getContrastTextColor(bgColor)

  return (
    <View style={styles.container}>
      {/* 背景模糊层 */}
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType="dark"
        blurAmount={20}
        reducedTransparencyFallbackColor={bgColor}
      />
      
      {/* 背景色层 */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: bgColor, opacity: 0.85 }]} />

      {/* 内容 */}
      <View style={styles.content}>
        {/* 封面 */}
        <View style={styles.coverWrap}>
          {pic ? (
            <Image source={{ uri: pic }} style={styles.cover} />
          ) : (
            <View style={[styles.coverPlaceholder, { backgroundColor: theme['c-primary'] || '#07c556' }]}>
              <Text size={24} color="#fff">♪</Text>
            </View>
          )}
        </View>

        {/* 歌曲信息 */}
        <View style={styles.info}>
          <Text numberOfLines={1} size={14} color={textColor} style={{ fontWeight: '600' }}>
            {name || '未播放'}
          </Text>
          <Text numberOfLines={1} size={12} color={textColor} style={{ opacity: 0.6 }}>
            {singer || ''}
          </Text>
        </View>

        {/* 控制按钮 */}
        <View style={styles.controls}>
          <ControlBtn icon="⏮" size={20} onPress={() => playPrev()} color={controlColor} />
          <ControlBtn icon={isPlay ? "⏸" : "▶️"} size={24} onPress={() => togglePlay()} color={controlColor} />
          <ControlBtn icon="⏭" size={20} onPress={() => playNext()} color={controlColor} />
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    flex: 1,
  },
  coverWrap: {
    width: 56,
    height: 56,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 10,
  },
  cover: {
    width: 56,
    height: 56,
    borderRadius: 10,
  },
  coverPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ctrlBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
