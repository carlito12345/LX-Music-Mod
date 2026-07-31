/**
 * GradientText - 渐变色文字组件
 * SVG Text 实现,无 MaskedView 闪烁问题
 */
import { memo, useRef, useState } from 'react'
import { type TextStyle, View, TouchableOpacity, LayoutChangeEvent } from 'react-native'
import Svg, { Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg'

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
  const [w, setW] = useState(0)
  const gradientColors = colors || GRADIENT_PRESETS[preset]?.colors || GRADIENT_PRESETS.aurora.colors
  const fontSize = size || 16
  const lh = lineHeight || fontSize * 1.3

  const onLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width
    if (width > 0) setW(width)
  }

  // 宽度未测量前渲染空白,避免先左后中的跳动
  if (w === 0) {
    const placeholder = (
      <View onLayout={onLayout} style={{ width: '100%', height: lh + 4 }} />
    )
    if (onPress) return <TouchableOpacity onPress={onPress} style={{ width: '100%', height: lh + 4 }}>{placeholder}</TouchableOpacity>
    return placeholder
  }

  const content = (
    <Svg width={w} height={lh + 4}>
      <Defs>
        <LinearGradient id="g" x1="0" y1="0" x2="1" y2="0">
          {gradientColors.map((c, i) => (
            <Stop key={i} offset={`${(i / Math.max(gradientColors.length - 1, 1)) * 100}%`} stopColor={c} />
          ))}
        </LinearGradient>
      </Defs>
      <SvgText
        x={textAlign === 'center' ? w / 2 : textAlign === 'right' ? w : 0}
        y={lh * 0.82}
        fontSize={fontSize}
        fontWeight="bold"
        fill="url(#g)"
        textAnchor={textAlign === 'center' ? 'middle' : textAlign === 'right' ? 'end' : 'start'}
      >
        {text}
      </SvgText>
    </Svg>
  )

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} onLayout={onLayout} style={{ width: '100%', height: lh + 4 }}>
        {content}
      </TouchableOpacity>
    )
  }

  return (
    <View onLayout={onLayout} style={{ width: '100%', height: lh + 4 }}>
      {content}
    </View>
  )
})
