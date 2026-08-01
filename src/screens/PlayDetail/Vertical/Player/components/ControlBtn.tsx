/**
 * ControlBtn - 播放控制按钮,使用 TouchableOpacity + Animated spring
 * 自动适应背景色,确保可见性
 */
import { memo, useEffect, useCallback, useRef } from 'react'
import { View, TouchableOpacity, Animated } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { playNext, playPrev, togglePlay } from '@/core/player/player'
import { useIsPlay } from '@/store/player/hook'
import { useSettingValue } from '@/store/setting/hook'
import { createStyle } from '@/utils/tools'
import { useWindowSize } from '@/utils/hooks'
import { BTN_WIDTH } from './MoreBtn/Btn'
import { getContrastTextColor } from '@/utils/colorContrast'
import MagicRings from '@/components/common/MagicRings'

interface ControlBtnProps {
  backgroundColor: string
}

const PressBtn = memo(({ icon, size, onPress, controlColor }: { icon: string; size: number; onPress: () => void; controlColor: string }) => {
  const controlBtnEnabled = useSettingValue('playDetail.effect.controlBtn.enabled')
  const scale = useRef(new Animated.Value(1)).current

  const handlePressIn = () => {
    if (!controlBtnEnabled) return
    Animated.spring(scale, {
      toValue: 0.88,
      tension: 300,
      friction: 12,
      useNativeDriver: false,
    }).start()
  }

  const handlePressOut = () => {
    if (!controlBtnEnabled) return
    Animated.spring(scale, {
      toValue: 1,
      tension: 200,
      friction: 15,
      useNativeDriver: false,
    }).start()
  }

  const magicRings = useSettingValue('playDetail.effect.magicRings.enabled')
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <MagicRings
        enabled={magicRings}
        color={controlColor}
        radius={size * 0.55}
        onPress={onPress}
        style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}
      >
        <Icon name={icon} color={controlColor} rawSize={size * 0.7} />
      </MagicRings>
    </Animated.View>
  )
})

// InstantPlayBtn - 无圆底纯图标
const InstantPlayBtn = ({ size, backgroundColor }: { size: number; backgroundColor: string }) => {
  const isPlay = useIsPlay()
  const color = getContrastTextColor(backgroundColor)

  const magicRings = useSettingValue('playDetail.effect.magicRings.enabled')
  return (
    <MagicRings
      enabled={magicRings}
      color={color}
      radius={size * 0.55}
      onPress={togglePlay}
      style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}
    >
      <Icon name={isPlay ? 'pause' : 'play'} color={color} rawSize={size * 0.85} />
    </MagicRings>
  )
}

const MAX_SIZE = BTN_WIDTH * 1.6
const MIN_SIZE = BTN_WIDTH * 1.2

export default memo(({ backgroundColor }: ControlBtnProps) => {
  const winSize = useWindowSize()
  const maxHeight = Math.max(winSize.height * 0.11, MIN_SIZE)
  const size = Math.min(Math.max(winSize.width * 0.33 * (global.lx?.fontSize ?? 1) * 0.4, MIN_SIZE), MAX_SIZE, maxHeight)
  
  const controlColor = getContrastTextColor(backgroundColor)

  return (
    <View style={styles.container}>
      <PressBtn icon="prevMusic" size={size} onPress={() => playPrev()} controlColor={controlColor} />
      <InstantPlayBtn size={size} backgroundColor={backgroundColor} />
      <PressBtn icon="nextMusic" size={size} onPress={() => playNext()} controlColor={controlColor} />
    </View>
  )
})

const styles = createStyle({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 12,
  },

})
