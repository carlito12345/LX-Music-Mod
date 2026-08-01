/**
 * AppCardSection - App 设置分类卡片(iOS 风格)
 * 与播放器设置一致的卡片风格: 白卡+描边 / 深色亮材料
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
    <View style={{ marginBottom: 18 }}>
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
