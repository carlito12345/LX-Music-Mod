/**
 * LyricGlowWrapper - 歌词发光包装组件
 * 为歌词添加发光效果(使用 shadow)
 */
import React, { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'
import { useTheme } from '@/store/theme/hook'

interface LyricGlowWrapperProps {
  children: React.ReactNode
}

export const LyricGlowWrapper = memo<LyricGlowWrapperProps>(({ children }) => {
  const enabled = useSettingValue('playDetail.effect.lyricGlow.enabled')
  const theme = useTheme()

  if (!enabled) return <>{children}</>

  const primaryColor = theme['c-primary'] || '#9cffdf'

  return (
    <View style={{
      shadowColor: primaryColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 12,
      elevation: 8,
    }}>
      {children}
    </View>
  )
})
