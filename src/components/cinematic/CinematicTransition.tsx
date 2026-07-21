/**
 * CinematicTransition - 电影镜头转场效果插件
 *
 * 功能:
 * - 封面入场缩放 + 淡入动画
 * - 歌曲切换时背景交叉淡入淡出
 * - 组件序列入场动画
 */
import { useRef, useEffect, useMemo } from 'react'
import { Animated, type StyleProp, type ViewStyle } from 'react-native'

/**
 * 入场缩放 + 淡入动画值
 * 用于封面等主要视觉元素
 */
export const useEntryAnimation = (deps: any[] = []) => {
  const scaleAnim = useRef(new Animated.Value(0.92)).current
  const opacityAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    scaleAnim.setValue(0.92)
    opacityAnim.setValue(0)

    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: false,
      }),
    ]).start()
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps

  return { scaleAnim, opacityAnim }
}

/**
 * 背景交叉淡入淡出动画值
 * 当歌曲切换时,旧背景淡出,新背景淡入
 */
export const useBackgroundCrossfade = (deps: any[] = []) => {
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    fadeAnim.setValue(0)
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false,
    }).start()
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps

  return fadeAnim
}

/**
 * 序列入场动画
 * 子元素按顺序淡入 + 上移
 */
export const useEntryStagger = (index: number, baseDelay = 80) => {
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 300,
      delay: index * baseDelay,
      useNativeDriver: false,
    }).start()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const style: Animated.WithAnimatedObject<ViewStyle> = {
    opacity: anim,
    transform: [{
      translateY: anim.interpolate({
        inputRange: [0, 1],
        outputRange: [15, 0],
      }),
    }],
  }

  return style
}

/**
 * 缩放淡入动画样式
 * 用于包裹需要入场动画的元素
 */
export const useZoomFadeStyle = (scaleAnim: Animated.Value, opacityAnim: Animated.Value): StyleProp<ViewStyle> => {
  return useMemo(() => ({
    opacity: opacityAnim,
    transform: [{ scale: scaleAnim }],
  }), [scaleAnim, opacityAnim])
}
