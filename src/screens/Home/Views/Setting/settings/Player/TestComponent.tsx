import { memo } from 'react'
import { View } from 'react-native'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'

export default memo(() => {
  const theme = useTheme()
  return (
    <View style={{ padding: 10, backgroundColor: 'red', margin: 10 }}>
      <Text size={16} color="#fff">测试组件 - 如果看到这段文字说明渲染正常</Text>
    </View>
  )
})
