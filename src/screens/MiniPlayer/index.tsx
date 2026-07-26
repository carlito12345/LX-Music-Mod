import { memo, useState, useCallback } from 'react'
import { View, StyleSheet, TouchableOpacity, Image, LayoutChangeEvent } from 'react-native'
import { BlurView } from '@react-native-community/blur'
import { usePlayerMusicInfo, useIsPlay } from '@/store/player/hook'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import { playNext, playPrev, togglePlay } from '@/core/player/player'
import { useLrcPlay } from '@/plugins/lyric'
import { getContrastTextColor } from '@/utils/colorContrast'

const S = {
  coverRatio: 0.08,
  coverRadius: 0.018,
  iconRatio: 0.03,
  playRatio: 0.05,
  titleRatio: 0.02,
  subRatio: 0.016,
}

export default memo(() => {
  const [W, setW] = useState(400)
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width
    if (w > 0) setW(w)
  }, [])

  const theme = useTheme()
  const mi = usePlayerMusicInfo()
  const isPlay = useIsPlay()
  const lrcInfo = useLrcPlay()
  const name = mi.name || ''
  const singer = mi.singer || ''
  const pic = mi.pic || ''
  const lrcLine = lrcInfo.text || ''
  const sc = useSettingValue('playDetail.background.solidColor')
  const bg = sc || theme['c-content-background'] || '#1a1a2e'
  const tc = getContrastTextColor(bg)
  const c = { coverSize: W * S.coverRatio, iconSz: W * S.iconRatio, playSz: W * S.playRatio, pad: W * 0.02 }

  return (
    <View style={styles.container} onLayout={onLayout}>
      <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={20} reducedTransparencyFallbackColor={bg} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: bg, opacity: 0.8 }]} />

      {/* 封面 - 绝对定位在左侧 */}
      <View style={[styles.coverWrap, { width: c.coverSize, height: c.coverSize, borderRadius: c.coverRadius, left: c.pad, top: (W * 0.22 - c.coverSize) / 2 }]}>
        {pic ? (
          <Image source={{ uri: pic }} style={[styles.cover, { borderRadius: c.coverRadius }]} />
        ) : (
          <View style={[styles.coverPlaceholder, { borderRadius: c.coverRadius, backgroundColor: tc + '20' }]}>
            <Text size={c.coverSize * 0.3} color={tc} style={{ opacity: 0.5 }}>♪</Text>
          </View>
        )}
      </View>

      {/* 歌名 - 在封面右侧 */}
      <View style={[styles.infoArea, { left: c.pad * 2 + c.coverSize, top: W * 0.02 }]}>
        <Text numberOfLines={1} size={S.titleRatio * W} color={tc} style={{ fontWeight: '600' }}>{name || '未播放'}</Text>
        <Text numberOfLines={1} size={S.subRatio * W} color={tc} style={{ opacity: 0.5 }}>{singer || ''}</Text>
        <Text numberOfLines={1} size={S.subRatio * W} color={tc} style={{ opacity: 0.4 }}>{lrcLine || '♪'}</Text>
      </View>

      {/* 控件 - 绝对定位在右侧 */}
      <View style={[styles.controls, { right: c.pad, top: (W * 0.22 - c.playSz) / 2, gap: W * 0.06 }]}>
        <TouchableOpacity style={[styles.btn, { width: c.playSz * 0.9, height: c.playSz * 0.9, borderRadius: c.playSz * 0.45 }]} onPress={() => playPrev()} activeOpacity={0.6}>
          <Icon name="skip-previous" size={c.iconSz} color={tc} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.pbtn, { width: c.playSz, height: c.playSz, borderRadius: c.playSz / 2, backgroundColor: tc + '18' }]} onPress={() => togglePlay()} activeOpacity={0.6}>
          <Icon name={isPlay ? 'pause-circle' : 'play-circle'} size={c.playSz * 0.75} color={tc} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { width: c.playSz * 0.9, height: c.playSz * 0.9, borderRadius: c.playSz * 0.45 }]} onPress={() => playNext()} activeOpacity={0.6}>
          <Icon name="skip-next" size={c.iconSz} color={tc} />
        </TouchableOpacity>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: { width: '100%', height: '100%', overflow: 'visible' },
  coverWrap: { position: 'absolute', overflow: 'hidden', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
  cover: { width: '100%', height: '100%' },
  coverPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  infoArea: { position: 'absolute', right: 120 },
  controls: { position: 'absolute', flexDirection: 'row', alignItems: 'center' },
  btn: { justifyContent: 'center', alignItems: 'center' },
  pbtn: { justifyContent: 'center', alignItems: 'center' },
})
// 注意:gap 使用 W * 0.04 需要动态计算,已在 JSX 中设置
