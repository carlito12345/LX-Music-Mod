import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, PanResponder } from 'react-native'
import { createStyle } from '@/utils/tools'
import { scaleSizeW, scaleSizeH } from '@/utils/pixelRatio'
import { useDrag } from '@/utils/hooks'
import { Icon } from '@/components/common/Icon'
import { getContrastTextColor } from '@/utils/colorContrast'
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
  
  // 自适应黑白
  const trackColor = 'rgba(255,255,255,0.2)'
  const bufferedColor = 'rgba(255,255,255,0.25)'
  const fillColor = 'rgba(255,255,255,0.85)'
  const dotColor = '#ffffff'

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
        <View style={{ ...styles.progressBar, backgroundColor: fillColor, width: currentPct, position: 'absolute', left: 0, top: 0 }}>
          <Icon name="full_stop" color={dotColor} rawSize={bigDotSize} style={progressDotStyle} />
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
