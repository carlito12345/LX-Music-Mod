import { memo } from 'react'
import { View } from 'react-native'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'

export default memo(() => {
  const theme = useTheme()
  return (
    <View style={{ padding: 10, marginVertical: 5, backgroundColor: 'rgba(128,128,128,0.1)', borderRadius: 8 }}>
      <Text size={14} color={theme['c-primary-font']}>🖼️ 封面样式设置</Text>
      <Text size={12} color={theme['c-font-label']} style={{ marginTop: 5 }}>此功能正在开发中...</Text>
    </View>
  )
})
