/**
 * GradientText - 渐变色文字组件
 * 使用 MaskedView + LinearGradient 实现真正的文字渐变
 */
import { memo } from 'react'
import { Text as RNText, type TextStyle, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import MaskedView from '@react-native-masked-view/masked-view'

// 内置渐变预设(流行配色)
export const GRADIENT_PRESETS: Record<string, { name: string, colors: string[] }> = {
  aurora: { name: '极光', colors: ['#00e676', '#00b0ff', '#d500f9'] },
  sunset: { name: '日落', colors: ['#ff9800', '#ff1744', '#d500f9'] },
  ocean: { name: '海洋', colors: ['#00b0ff', '#1de9b6', '#00e676'] },
  flame: { name: '烈焰', colors: ['#ffea00', '#ff6d00', '#ff1744'] },
  neon: { name: '霓虹', colors: ['#ea80fc', '#7c4dff', '#2979ff'] },
  candy: { name: '糖果', colors: ['#ff4081', '#f48fb1', '#ea80fc'] },
  gold: { name: '流金', colors: ['#ffea00', '#ffab00', '#ff6d00'] },
  ice: { name: '冰雪', colors: ['#80d8ff', '#00b0ff', '#2979ff'] },
}

interface GradientTextProps {
  text: string
  colors?: string[]
  preset?: string
  style?: TextStyle | TextStyle[]
  size?: number
  lineHeight?: number
  textAlign?: 'left' | 'center' | 'right'
  onPress?: () => void
}

export default memo(({ text, colors, preset = 'aurora', style, size = 16, lineHeight, textAlign = 'center', onPress }: GradientTextProps) => {
  const gradientColors = colors || GRADIENT_PRESETS[preset]?.colors || GRADIENT_PRESETS.aurora.colors
  const textStyle: TextStyle = {
    fontSize: size,
    lineHeight: lineHeight || size * 1.3,
    textAlign,
    fontWeight: 'bold',
  }
  return (
    <MaskedView
      androidRenderingMode="software"
      maskElement={
        <RNText style={[textStyle, style]} onPress={onPress}>{text}</RNText>
      }
    >
      <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <RNText style={[textStyle, style, { opacity: 0 }]}>{text}</RNText>
      </LinearGradient>
    </MaskedView>
  )
})
