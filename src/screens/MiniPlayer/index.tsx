import { memo, useMemo } from 'react'
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { BlurView } from '@react-native-community/blur'
import { usePlayerMusicInfo, useIsPlay } from '@/store/player/hook'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
import { playNext, playPrev, togglePlay } from '@/core/player/player'
import { getContrastTextColor } from '@/utils/colorContrast'

const ControlBtn = memo(({ icon, size, onPress, color }: {
  icon: string; size: number; onPress: () => void; color: string
}) => (
  <TouchableOpacity onPress={onPress} style={styles.ctrlBtn}>
    <Icon name={icon} size={size} color={color} />
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

      {/* 内容 - 水平居中分布 */}
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

        {/* 歌曲信息 + 歌词 */}
        <View style={styles.infoArea}>
          <Text numberOfLines={1} size={16} color={textColor} style={{ fontWeight: '600' }}>
            {name || '未播放'}
          </Text>
          <Text numberOfLines={1} size={13} color={textColor} style={{ opacity: 0.6 }}>
            {singer || ''}
          </Text>
        </View>

        {/* 进度条 - 细条 */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { backgroundColor: controlColor + '80' }]} />
        </View>

        {/* 控制按钮 */}
        <View style={styles.controls}>
          <ControlBtn icon="prevMusic" size={22} onPress={() => playPrev()} color={controlColor} />
          <ControlBtn icon={isPlay ? "pause" : "play"} size={28} onPress={() => togglePlay()} color={controlColor} />
          <ControlBtn icon="nextMusic" size={22} onPress={() => playNext()} color={controlColor} />
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    flex: 1,
  },
  coverWrap: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cover: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  coverPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoArea: {
    flex: 1,
    marginHorizontal: 12,
    justifyContent: 'center',
  },
  progressBar: {
    width: 60,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(128,128,128,0.3)',
    overflow: 'hidden',
  },
  progressFill: {
    width: '30%',
    height: '100%',
    borderRadius: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 8,
  },
  ctrlBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
