import { View, Text, StyleSheet } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'
import { useTheme } from '@/store/theme/hook'
import { getContrastTextColor } from '@/utils/colorContrast'

export default () => {
  const sc = useSettingValue('playDetail.background.solidColor')
  const theme = useTheme()
  const bg = sc || theme['c-content-background'] || '#1a1a2e'
  const tc = getContrastTextColor(bg)

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.box, { backgroundColor: tc + '80' }]}>
        <Text style={{ color: tc, fontSize: 16 }}>L</Text>
      </View>
      <View style={[styles.fill, { backgroundColor: tc + '20' }]}>
        <Text style={{ color: tc, fontSize: 16 }}>CENTER</Text>
      </View>
      <View style={[styles.box, { backgroundColor: tc + '80' }]}>
        <Text style={{ color: tc, fontSize: 16 }}>R</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  box: { width: 60, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  fill: { flex: 1, height: 40, justifyContent: 'center', alignItems: 'center', marginHorizontal: 8, borderRadius: 8 },
})
