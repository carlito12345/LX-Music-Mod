import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { View, PanResponder, Animated, Easing } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import { scaleSizeW, scaleSizeH } from '@/utils/pixelRatio'
import { useDrag } from '@/utils/hooks'

const progressContentPadding = 8
const progressHeight = 6
const progressContentHeight = progressContentPadding * 2 + progressHeight

// 呼吸发光点 - 放在 overflow:visible 容器内
const GlowDot = memo(({ theme, pct }: { theme: any; pct: string }) => {
  const shimmerEnabled = useSettingValue('playDetail.progress.shimmer')
  const primaryColor = theme['c-primary'] || '#07c556'
  const breathe = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(breathe, { toValue: 0, duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ])
    ).start()
  }, [breathe])

  const outerSize = breathe.interpolate({ inputRange: [0, 1], outputRange: [24, 34] })
  const outerOpacity = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.45] })
  const midOpacity = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.6] })
  const dotScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] })

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: pct,
        top: '50%',
        marginTop: -14,
        marginLeft: -14,
        width: 28,
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
        // overflow visible by default in RN
      }}
    >
      {/* 最外层辉光 */}
      <Animated.View style={{
        position: 'absolute',
        width: outerSize,
        height: outerSize,
        borderRadius: 17,
        backgroundColor: primaryColor,
        opacity: outerOpacity,
      }} />
      {/* 中层辉光 固定 18px */}
      <Animated.View style={{
        position: 'absolute',
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: primaryColor,
        opacity: midOpacity,
      }} />
      {/* 主体圆点 14px 带呼吸缩放 */}
      <Animated.View style={{
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: primaryColor,
        transform: [{ scale: dotScale }],
        shadowColor: primaryColor,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 10,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        {/* 高光 */}
        <View style={{
          position: 'absolute',
          top: 2, left: 3,
          width: 6, height: 3,
          borderRadius: 2,
          backgroundColor: 'rgba(255,255,255,0.7)',
        }} />
      </Animated.View>
    </View>
  )
})

// 流光 - 细长柔光,仅在进度条内显示
const ShimmerEffect = memo(({ enabled }: { enabled: boolean }) => {
  if (!enabled) return null
  const shimmerAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start()
  }, [shimmerAnim])

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-80, 400],
  })

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0, bottom: 0,
        width: 50,
        transform: [{ translateX }, { skewX: '-25deg' }],
      }}
      pointerEvents="none"
    >
      {/* 左柔边 */}
      <View style={{ position: 'absolute', top: 0, bottom: 0, left: 5, width: 16, backgroundColor: 'rgba(255,255,255,0.15)' }} />
      {/* 高光核心 */}
      <View style={{ position: 'absolute', top: 0, bottom: 0, left: 19, width: 5, backgroundColor: 'rgba(255,255,255,0.6)' }} />
      {/* 右柔边 */}
      <View style={{ position: 'absolute', top: 0, bottom: 0, left: 24, width: 14, backgroundColor: 'rgba(255,255,255,0.1)' }} />
    </Animated.View>
  )
})

const PreassBar = memo(({ onDragState, setDragProgress, onSetProgress }: {
  onDragState: (drag: boolean) => void
  setDragProgress: (progress: number) => void
  onSetProgress: (progress: number) => void
}) => {
  const { onLayout, onDragStart, onDragEnd, onDrag } = useDrag(onSetProgress, onDragState, setDragProgress)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderMove: (evt, gestureState) => { onDrag(gestureState.dx) },
      onPanResponderGrant: (evt, gestureState) => { onDragStart(gestureState.dx, evt.nativeEvent.locationX) },
      onPanResponderRelease: () => { onDragEnd() },
    }),
  ).current

  return <View onLayout={onLayout} style={styles.pressBar} {...panResponder.panHandlers} />
})

const Progress = ({ progress, duration, buffered }: {
  progress: number
  duration: number
  buffered: number
}) => {
  const theme = useTheme()
  const [draging, setDraging] = useState(false)
  const [dragProgress, setDragProgress] = useState(0)
  const progressStr: `${number}%` = `${progress * 100}%`
  const dragStr: `${number}%` = `${dragProgress * 100}%`

  const durationRef = useRef(duration)
  useEffect(() => { durationRef.current = duration }, [duration])
  const onSetProgress = useCallback((p: number) => {
    global.app_event.setProgress(p * durationRef.current)
  }, [])

  const shimmerEnabled = useSettingValue('playDetail.progress.shimmer')
  const primaryColor = theme['c-primary'] || '#07c556'
  const bgColor = theme['c-primary-light-300-alpha-800'] || 'rgba(7,197,86,0.2)'
  const bufferedColor = theme['c-primary-light-400-alpha-700'] || 'rgba(7,197,86,0.3)'
  const currentPct = draging ? dragStr : progressStr

  return (
    <View style={styles.progress}>
      {/* 进度条轨道 - overflow:hidden 裁剪流光 */}
      <View style={styles.progressInner}>
        {/* 背景 */}
        <View style={{ ...styles.bar, backgroundColor: bgColor, width: '100%' }} />
        {/* 缓冲 */}
        <View style={{ ...styles.bar, backgroundColor: bufferedColor, width: `${buffered * 100}%` }} />
        {/* 进度填充 */}
        <View style={{ ...styles.bar, backgroundColor: primaryColor, width: currentPct }}>
          {/* 高光层 */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%', backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 4 }} />
          {/* 流光 */}
          <ShimmerEffect enabled={shimmerEnabled} />
        </View>
      </View>

      {/* 发光点 - 独立层,不受 overflow:hidden 限制 */}
      <GlowDot theme={theme} pct={currentPct} />

      {/* 触摸层 */}
      <PreassBar onDragState={setDraging} setDragProgress={setDragProgress} onSetProgress={onSetProgress} />
    </View>
  )
}

const styles = createStyle({
  progress: {
    width: '100%',
    height: progressContentHeight,
    paddingTop: progressContentPadding,
    paddingBottom: progressContentPadding,
    zIndex: 1,
  },
  progressInner: {
    height: progressHeight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: progressHeight,
    borderRadius: 4,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  pressBar: {
    position: 'absolute',
    left: 0, top: 0,
    height: progressContentHeight,
    width: '100%',
    zIndex: 6,
  },
})

export default Progress
