import { memo, useCallback } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import Text from '@/components/common/Text'
import { updateSetting } from '@/core/common'

export default memo(() => {
  const theme = useTheme()
  const enabled = useSettingValue('playDetail.progress.shimmer')

  const handleToggle = useCallback(() => {
    updateSetting({ 'playDetail.progress.shimmer': !enabled })
  }, [enabled])

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.row} onPress={handleToggle} activeOpacity={0.6}>
        <Text size={14} color={theme['c-font']} style={styles.label}>进度条流光特效</Text>
        <View style={[styles.toggle, enabled && { backgroundColor: theme['c-primary'] }]}>
          <View style={[styles.toggleDot, enabled && { left: 20 }]} />
        </View>
      </TouchableOpacity>
    </View>
  )
})

const styles = createStyle({
  container: { paddingHorizontal: 15, paddingVertical: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(128,128,128,0.1)',
    borderRadius: 8,
    gap: 10,
  },
  label: { flex: 1 },
  toggle: {
    width: 40, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(128,128,128,0.3)',
    justifyContent: 'center', paddingHorizontal: 2,
  },
  toggleDot: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#fff', position: 'absolute', left: 2,
  },
})
