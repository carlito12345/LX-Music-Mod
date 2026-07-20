/**
 * BlurBackground - 毛玻璃背景组件
 * 
 * Android 11 不支持 WindowManager BlurView,
 * 使用 RenderScript 软件模糊 + 半透明叠加作为降级方案。
 * 
 * 主要用途:播放器控制栏、PlayerBar 底部等需要毛玻璃效果的区域。
 */
import { memo } from 'react'
import { View, StyleSheet, Platform, type ViewStyle } from 'react-native'

// BlurView from @react-native-community/blur
// Android 12+ 使用 renderEffect,低版本使用降级方案
let BlurViewComponent: any
try {
  BlurViewComponent = require('@react-native-community/blur').BlurView
} catch {
  BlurViewComponent = null
}

interface BlurBackgroundProps {
  style?: ViewStyle
  blurAmount?: number
  blurType?: 'light' | 'dark' | 'xlight' | 'regular' | 'prominent'
  /** 半透明叠加颜色,用于增强毛玻璃视觉效果 */
  overlayColor?: string
  children?: React.ReactNode
}

const BlurBackground = memo(({
  style,
  blurAmount = 20,
  blurType = 'dark',
  overlayColor = 'rgba(0, 0, 0, 0.45)',
  children,
}: BlurBackgroundProps) => {
  // Android 12+ (API 31+) 支持 BlurView
  // Android 11 降级为深色半透明蒙版
  const canUseBlur = Platform.OS === 'ios' || Platform.Version >= 31

  if (BlurViewComponent && canUseBlur) {
    return (
      <BlurViewComponent
        style={[styles.container, style]}
        blurType={blurType}
        blurAmount={blurAmount}
        reducedTransparencyFallbackColor="rgba(28,28,30,0.92)"
        overlayColor={overlayColor}
      >
        {children}
      </BlurViewComponent>
    )
  }

  // Fallback: 半透明黑色背景
  return (
    <View style={[styles.container, { backgroundColor: overlayColor }, style]}>
      {children}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
})

export default BlurBackground
