/**
 * ControlBtn - 播放控制按钮,使用 TouchableOpacity + Animated spring
 */
import { memo, useEffect, useCallback, useRef } from 'react'
import { View, TouchableOpacity, Animated } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { playNext, playPrev, togglePlay } from '@/core/player/player'
import { useIsPlay } from '@/store/player/hook'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import { createStyle } from '@/utils/tools'
import { useWindowSize } from '@/utils/hooks'
import { BTN_WIDTH } from './MoreBtn/Btn'

const PressBtn = memo(({ icon, size, onPress }: { icon: string; size: number; onPress: () => void }) => {
  const theme = useTheme()
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

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={0.6}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}
      >
        <Icon name={icon} color={theme['c-button-font']} rawSize={size * 0.7} />
      </TouchableOpacity>
    </Animated.View>
  )
})

const PlayBtn = memo(({ size }: { size: number }) => {
  const isPlay = useIsPlay()
  const theme = useTheme()
  const controlBtnEnabled = useSettingValue('playDetail.effect.controlBtn.enabled')
  const scale = useRef(new Animated.Value(1)).current
  const glowAnim = useRef(new Animated.Value(0)).current

  // Breathing glow animation when playing
  useEffect(() => {
    if (!controlBtnEnabled || !isPlay) {
      glowAnim.setValue(0)
      return
    }
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1500, useNativeDriver: false }),
      ])
    ).start()
    return () => glowAnim.stopAnimation()
  }, [isPlay, controlBtnEnabled])

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

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  })

  return (
    <View style={{ justifyContent: 'center', alignItems: 'center', width: size * 1.5, height: size * 1.5 }}>
      {/* Breathing glow ring */}
      {controlBtnEnabled && isPlay && (
        <Animated.View
          style={{
            position: 'absolute',
            width: size * 1.4,
            height: size * 1.4,
            borderRadius: size * 0.7,
            backgroundColor: theme['c-primary'],
            opacity: glowOpacity,
          }}
        />
      )}
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          activeOpacity={0.6}
          onPress={togglePlay}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={{ width: size * 1.2, height: size * 1.2, justifyContent: 'center', alignItems: 'center' }}
        >
          <Icon name={isPlay ? 'pause' : 'play'} color={theme['c-button-font']} rawSize={size * 0.85} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
})

const MAX_SIZE = BTN_WIDTH * 1.6
const MIN_SIZE = BTN_WIDTH * 1.2

export default () => {
  const winSize = useWindowSize()
  const maxHeight = Math.max(winSize.height * 0.11, MIN_SIZE)
  const size = Math.min(Math.max(winSize.width * 0.33 * (global.lx?.fontSize ?? 1) * 0.4, MIN_SIZE), MAX_SIZE, maxHeight)

  return (
    <View style={{ ...styles.container, maxHeight }}>
      <PressBtn icon="prevMusic" size={size} onPress={() => playPrev()} />
      <PlayBtn size={size} />
      <PressBtn icon="nextMusic" size={size} onPress={() => playNext()} />
    </View>
  )
}

const styles = createStyle({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    flexGrow: 1,
    flexShrink: 1,
    paddingHorizontal: '4%',
    paddingVertical: 22,
  },
})
