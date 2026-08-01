/**
 * SettingSection - iOS Settings 风格分组
 * 白底 + 极淡描边卡片(非灰色填充块), 分组标题 13pt 灰
 */
import { memo } from 'react'
import { View, StyleSheet } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'

interface Props {
  title?: string
  children: React.ReactNode
}

export default memo(({ title, children }: Props) => {
  const theme = useTheme()
  const isDark = !!theme.isDark

  return (
    <View style={{ marginBottom: 20 }}>
      {title ? (
        <Text
          size={13}
          color={theme['c-font-label']}
          style={{ marginLeft: 18, marginBottom: 7, fontWeight: '500' }}
        >
          {title}
        </Text>
      ) : null}
      <View style={{
        borderRadius: 10,
        overflow: 'hidden',
        // 浅色: 白卡 + hairline 描边; 深色: 亮材料
        backgroundColor: isDark ? 'rgba(255,255,255,0.14)' : '#ffffff',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        shadowColor: '#000',
        shadowOpacity: isDark ? 0 : 0.04,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
        elevation: isDark ? 0 : 1,
      }}>
        {children}
      </View>
    </View>
  )
})
