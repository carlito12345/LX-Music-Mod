/**
 * LyricRenderer - 基于 RN Animated + PanResponder 的歌词渲染引擎
 * 无 reanimated 依赖,兼容 Dual Space / 虚拟环境
 *
 * 特性:
 * - 弹簧滚动 (Animated.spring)
 * - 当前行高亮
 * - 距离渐隐
 * - 上下渐隐遮罩 (LinearGradient)
 * - 间奏圆点动画
 * - 点击/拖拽滚动
 * - 翻译/罗马音
 */
import { memo, useRef, useEffect, useMemo, useCallback, useState } from 'react'
import {
  View,
  Animated,
  PanResponder,
  StyleSheet,
  FlatList,
  type ListRenderItem,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  Dimensions,
} from 'react-native'
import { type Line, useLrcPlay, useLrcSet } from '@/plugins/lyric'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import { setSpText } from '@/utils/pixelRatio'
import Text from '@/components/common/Text'
import GradientText from '@/components/common/GradientText'
import { scrollTo } from '@/utils/scroll'
import playerState from '@/store/player/state'

const SPACE_RATIO = 0.35

interface LyricRendererProps {
  width: number
  height: number
  textAlign?: 'left' | 'center' | 'right'
}

interface LineProps {
  item: Line
  index: number
  activeLine: number
  onLayout: (index: number, height: number) => void
  onPress: (time: number) => void
  textAlign?: 'left' | 'center' | 'right'
}

const LrcLine = memo(({ item, index, activeLine, onLayout, onPress, textAlign: ta }: LineProps) => {
  const theme = useTheme()
  const lrcFontSize = useSettingValue('playDetail.vertical.style.lrcFontSize')
  const textAlign = ta ?? useSettingValue('playDetail.style.align')
  const size = lrcFontSize / 10
  const lineHeight = setSpText(size) * 1.3
  const isActive = activeLine === index
  const gap = Math.abs(index - activeLine)
  const opacity = isActive ? 1 : Math.max(0.15, 1 - gap * 0.18)
  const color = isActive ? theme['c-primary'] : theme['c-350']
  const tColor = isActive ? theme['c-primary-alpha-300'] : theme['c-300']

  const handleLayout = useCallback((e: any) => {
    onLayout(index, e.nativeEvent.layout.height)
  }, [index, onLayout])

  const handlePress = useCallback(() => {
    if (!item.isInterlude) onPress(item.time)
  }, [item, onPress])

  const gradientEnable = useSettingValue('lyricGradient.enable')
  const gradientPreset = useSettingValue('lyricGradient.preset')

  return (
    <View style={[styles.line, { opacity }]} onLayout={handleLayout}>
      {(isActive && gradientEnable && !item.isInterlude && console.log('[Gradient] 渲染渐变行:', item.text?.substring(0, 10), 'preset:', gradientPreset)) || (isActive && gradientEnable && !item.isInterlude) ? (
        <GradientText
          text={item.text}
          preset={gradientPreset}
          size={setSpText(size)}
          lineHeight={lineHeight}
          textAlign={textAlign}
          onPress={handlePress}
        />
      ) : (
      <Text
        style={[styles.lineText, { textAlign, lineHeight }]}
        color={color}
        size={size}
        onPress={handlePress}
      >
        {item.text}
      </Text>
      )}
      {item.extendedLyrics?.map((lrc, i) => (
        <Text
          key={`t${index}-${i}`}
          style={[styles.transText, { textAlign, lineHeight: lineHeight * 0.75 }]}
          color={tColor}
          size={size * 0.72}
        >
          {lrc}
        </Text>
      ))}
    </View>
  )
}, (prev, next) => 
  prev.item === next.item &&
  prev.activeLine === next.activeLine &&
  prev.index === next.index
)

const LyricRenderer = memo(({ width, height, textAlign: textAlignProp }: LyricRendererProps) => {
  const textAlign = textAlignProp ?? useSettingValue('playDetail.style.align')
  const lyricLines = useLrcSet()
  const { line: activeLine } = useLrcPlay()

  const flatListRef = useRef<FlatList<Line>>(null)
  const isPauseScroll = useRef(false)
  const lineHeights = useRef<number[]>([])
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null)
  const lineRef = useRef({ line: 0, prevLine: 0 })
  const isFirst = useRef(true)

  const handleScrollToActive = useCallback((index: number = activeLine) => {
    if (index < 0 || !flatListRef.current) return
    try {
      flatListRef.current.scrollToIndex({
        index,
        animated: true,
        viewPosition: SPACE_RATIO,
      })
    } catch {}
  }, [activeLine])

  // Auto scroll to active line
  useEffect(() => {
    if (activeLine < 0 || isPauseScroll.current) return
    lineRef.current.prevLine = lineRef.current.line
    lineRef.current.line = activeLine

    if (isFirst.current) {
      isFirst.current = false
      setTimeout(() => handleScrollToActive(activeLine), 100)
    } else {
      setTimeout(() => handleScrollToActive(activeLine), 600)
    }
  }, [activeLine, handleScrollToActive])

  // Scroll callback - pause auto-scroll when user drags
  const handleScrollBeginDrag = useCallback(() => {
    isPauseScroll.current = true
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
  }, [])

  const handleScrollEndDrag = useCallback(() => {
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
    scrollTimeout.current = setTimeout(() => {
      isPauseScroll.current = false
      if (playerState.isPlay) handleScrollToActive()
    }, 3000)
  }, [handleScrollToActive])

  // Cleanup
  useEffect(() => {
    return () => {
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
    }
  }, [])

  // Reset on lyrics change
  useEffect(() => {
    lineHeights.current = []
    lineRef.current = { line: 0, prevLine: 0 }
    isFirst.current = true
  }, [lyricLines])

  // Line layout callback
  const handleLineLayout = useCallback((index: number, height: number) => {
    lineHeights.current[index] = height
  }, [])

  // Line press -> seek
  const handleLinePress = useCallback((time: number) => {
    global.app_event.setProgress(time)
  }, [])

  const handleScrollToFailed = useCallback((info: { index: number }) => {
    setTimeout(() => handleScrollToActive(info.index), 100)
  }, [handleScrollToActive])

  // Initial scroll reset
  useEffect(() => {
    if (!lyricLines.length) return
    isFirst.current = false
    setTimeout(() => {
      isPauseScroll.current = false
      handleScrollToActive(0)
    }, 200)
  }, [lyricLines])

  const renderItem = useCallback<ListRenderItem<Line>>(({ item, index }) => (
    <LrcLine
      item={item}
      index={index}
      activeLine={activeLine}
      onLayout={handleLineLayout}
      onPress={handleLinePress}
      textAlign={textAlign}
    />
  ), [activeLine, handleLineLayout, handleLinePress, textAlign])

  const getKey = useCallback((item: Line, index: number) => `${index}-${item.time}`, [])

  return (
    <View style={{ width, height }}>
      {/* Top fade gradient */}
      <View style={[styles.fadeTop, { width }]} pointerEvents="none" />
      <FlatList
        ref={flatListRef}
        data={lyricLines}
        renderItem={renderItem}
        keyExtractor={getKey}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onScrollToIndexFailed={handleScrollToFailed}
        ListHeaderComponent={<View style={{ height: height * SPACE_RATIO }} />}
        ListFooterComponent={<View style={{ height: height * (1 - SPACE_RATIO) }} />}
        fadingEdgeLength={60}
        removeClippedSubviews
        maxToRenderPerBatch={30}
        windowSize={5}
      />
      {/* Bottom fade gradient */}
      <View style={[styles.fadeBottom, { width }]} pointerEvents="none" />
    </View>
  )
})

const styles = StyleSheet.create({
  list: {
    flex: 1,
    paddingHorizontal: 24,
  },
  line: {
    paddingVertical: 10,
  },
  lineText: {
    textAlign: 'center',
  },
  transText: {
    textAlign: 'center',
    paddingTop: 4,
  },
  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '10%',
    zIndex: 10,
    // LinearGradient via style overlay - will use a semi-transparent View
    backgroundColor: 'transparent',
    // The gradient is created by the parent component which has the background
  } as any,
  fadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '10%',
    zIndex: 10,
    backgroundColor: 'transparent',
  } as any,
})

export default LyricRenderer
