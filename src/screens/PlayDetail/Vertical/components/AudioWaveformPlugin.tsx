/**
 * 音频波形可视化插件
 * 外置插件模式,不影响核心播放详情页结构
 */
import { useEffect, useRef, memo } from 'react'
import { View, Animated, Easing } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useIsPlay } from '@/store/player/hook'
import { useSettingValue } from '@/store/setting/hook'
import { updateSetting } from '@/core/common'

const BAR_COUNT = 32

const WaveformView = memo(() => {
  const theme = useTheme()
  const isPlay = useIsPlay()
  const animations = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.3))
  ).current

  useEffect(() => {
    if (!isPlay) {
      Animated.parallel(
        animations.map(anim =>
          Animated.timing(anim, {
            toValue: 0.3,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false,
          })
        )
      ).start()
      return
    }

    const animationsArray = animations.map((anim, index) => {
      const baseHeight = 0.3 + Math.random() * 0.4
      const peakHeight = 0.6 + Math.random() * 0.4
      const duration = 400 + Math.random() * 600
      const delay = index * 30

      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: peakHeight,
            duration: duration / 2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: baseHeight,
            duration: duration / 2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      )
    })

    Animated.parallel(animationsArray).start()

    return () => {
      animationsArray.forEach(anim => anim.stop())
    }
  }, [isPlay, animations])

  return (
    <View style={styles.container}>
      {animations.map((anim, index) => {
        const height = anim.interpolate({
          inputRange: [0, 1],
          outputRange: ['15%', '100%'],
        })

        return (
          <Animated.View
            key={index}
            style={[
              styles.bar,
              {
                height,
                backgroundColor: theme['c-primary'],
                opacity: 0.6,
              },
            ]}
          />
        )
      })}
    </View>
  )
})

/**
 * 音频波形插件 Hook
 * 返回插件组件和切换函数
 */
export const useAudioWaveformPlugin = () => {
  const enabled = useSettingValue('playDetail.audioWaveform.enabled')

  const toggleWaveform = () => {
    updateSetting({ 'playDetail.audioWaveform.enabled': !enabled })
  }

  const WaveformPlugin = enabled ? WaveformView : null

  return {
    WaveformPlugin,
    enabled,
    toggleWaveform,
  }
}

const styles = createStyle({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 60,
    paddingHorizontal: 10,
  },
  bar: {
    flex: 1,
    marginHorizontal: 1,
    borderRadius: 2,
    minHeight: 4,
  },
})
