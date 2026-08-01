import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, PanResponder, Animated, Easing } from 'react-native'
import { createStyle } from '@/utils/tools'
import { scaleSizeW, scaleSizeH } from '@/utils/pixelRatio'
import { useDrag } from '@/utils/hooks'
import { Icon } from '@/components/common/Icon'
import { getContrastTextColor } from '@/utils/colorContrast'
import { useSettingValue } from '@/store/setting/hook'
// import { AppColors } from '@/theme'


// DefaultBar and BufferedBar replaced by inline styles in Progress


const PreassBar = memo(({ onDragState, setDragProgress, onSetProgress }: {
  onDragState: (drag: boolean) => void
  setDragProgress: (progress: number) => void
  onSetProgress: (progress: number) => void
}) => {
  const {
    onLayout,
    onDragStart,
    onDragEnd,
    onDrag,
  } = useDrag(onSetProgress, onDragState, setDragProgress)
  // const handlePress = useCallback((event: GestureResponderEvent) => {
  //   onPress(event.nativeEvent.locationX)
  // }, [onPress])

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
      // 关键: 拒绝被父级(wrapper 滑动手势)抢占,否则拖动超过30px会被抢走
      onPanResponderTerminationRequest: () => false,

      // onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        onDrag(gestureState.dx)
      },
      onPanResponderGrant: (evt, gestureState) => {
        // console.log(evt.nativeEvent.locationX, gestureState)
        onDragStart(gestureState.dx, evt.nativeEvent.locationX)
      },
      onPanResponderRelease: () => {
        onDragEnd()
      },
      // onPanResponderTerminate: (evt, gestureState) => {
      //   onDragEnd()
      // },
    }),
  ).current

  return <View onLayout={onLayout} style={styles.pressBar} {...panResponder.panHandlers} />
})


const Progress = ({ progress, duration, buffered, backgroundColor }: {
  progress: number
  duration: number
  buffered: number
  backgroundColor?: string
}) => {
  const [draging, setDraging] = useState(false)
  const [dragProgress, setDragProgress] = useState(0)
  const progressStr: `${number}%` = `${progress * 100}%`
  
  // ElasticSlider: 按下快速放大,松手用 Easing.back 过冲回弹(稳定可控)
  const elasticEnabled = useSettingValue('playDetail.effect.elasticSlider.enabled')
  const dotScale = useRef(new Animated.Value(1)).current
  useEffect(() => {
    if (!elasticEnabled) return
    if (draging) {
      Animated.timing(dotScale, {
        toValue: 1.7,
        duration: 140,
        useNativeDriver: true,
      }).start()
    } else {
      Animated.timing(dotScale, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.back(2.5)),
        useNativeDriver: true,
      }).start()
    }
  }, [draging, elasticEnabled])
  
  // 自适应黑白: 深色背景用白进度条, 浅色背景用深进度条
  const isLight = getContrastTextColor(backgroundColor || '#1a1a2e') === '#000000'
  const trackColor = isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)'
  const bufferedColor = isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.25)'
  const fillColor = isLight ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.85)'
  const dotColor = isLight ? '#000000' : '#ffffff'

  const bigDotSize = progressDotSize * 3.2
  const progressDotStyle = useMemo(() => {
    return {
      width: bigDotSize,
      position: 'absolute',
      right: -bigDotSize / 2,
      top: -(bigDotSize - progressHeightSize) / 2,
    } as const
  }, [])

  const durationRef = useRef(duration)
  useEffect(() => {
    durationRef.current = duration
  }, [duration])
  const onSetProgress = useCallback((p: number) => {
    global.app_event.setProgress(p * durationRef.current)
  }, [])

  const currentPct = draging ? `${dragProgress * 100}%` : progressStr

  return (
    <View style={styles.progress}>
      <View>
        <View style={{ ...styles.progressBar, backgroundColor: trackColor, position: 'absolute', width: '100%', left: 0, top: 0 }} />
        <View style={{ ...styles.progressBar, backgroundColor: bufferedColor, position: 'absolute', width: `${buffered * 100}%`, left: 0, top: 0 }} />
        <View style={{
          ...styles.progressBar,
          backgroundColor: fillColor,
          width: currentPct,
          position: 'absolute',
          left: 0,
          top: 0,
        }}>
          <Animated.View style={{
            ...progressDotStyle,
            transform: [{ scale: dotScale }],
          }}>
            <Icon name="full_stop" color={dotColor} rawSize={bigDotSize} />
          </Animated.View>
        </View>
      </View>
      <PreassBar onDragState={setDraging} setDragProgress={setDragProgress} onSetProgress={onSetProgress} />
    </View>
  )
}


const progressContentPadding = 10
const progressHeight = 3.6
const progressContentHeight = progressContentPadding * 2 + progressHeight
const progressHeightSize = scaleSizeH(progressHeight)
let progressDotSize = scaleSizeW(progressContentHeight * 0.8)
const styles = createStyle({
  progress: {
    width: '100%',
    height: progressContentHeight,
    // backgroundColor: 'rgba(0,0,0,0.5)',
    paddingTop: progressContentPadding,
    paddingBottom: progressContentPadding,
    zIndex: 1,
  },
  progressBar: {
    height: progressHeight,
    borderRadius: 4,
  },
  pressBar: {
    position: 'absolute',
    // backgroundColor: 'rgba(0,0,0,0.5)',
    left: 0,
    top: 0,
    height: progressContentHeight,
    paddingTop: progressContentPadding,
    paddingBottom: progressContentPadding,
    width: '100%',
    zIndex: 6,
  },
})

export default Progress
