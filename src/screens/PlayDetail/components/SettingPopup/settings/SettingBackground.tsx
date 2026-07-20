import { memo, useCallback } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import Text from '@/components/common/Text'
import { updateSetting } from '@/core/common'

const BG_TYPES = [
  { id: 'theme', label: '跟随主题' },
  { id: 'follow', label: '封面主色' },
  { id: 'blur', label: '封面模糊' },
] as const

export default memo(() => {
  const theme = useTheme()
  const bgType = useSettingValue('playDetail.background.type')
  const followCover = useSettingValue('playDetail.background.followCover')

  // 当前激活的模式:theme / follow / blur
  const activeMode = bgType === 'solid' && followCover ? 'follow' : bgType

  const handleTypeChange = useCallback((mode: string) => {
    if (mode === 'follow') {
      updateSetting({
        'playDetail.background.type': 'solid',
        'playDetail.background.followCover': true,
      })
    } else {
      updateSetting({
        'playDetail.background.type': mode as LX.AppSetting['playDetail.background.type'],
        'playDetail.background.followCover': false,
      })
    }
  }, [])

  return (
    <View style={styles.container}>
      <Text size={14} color={theme['c-primary-font']} style={styles.title}>背景模式</Text>
      <View style={styles.row}>
        {BG_TYPES.map(type => (
          <TouchableOpacity
            key={type.id}
            style={[styles.chip, activeMode === type.id && { backgroundColor: theme['c-primary'] }]}
            onPress={() => handleTypeChange(type.id)}
          >
            <Text size={12} color={activeMode === type.id ? '#fff' : theme['c-font']}>{type.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
})

const styles = createStyle({
  container: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  title: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(128,128,128,0.15)',
  },
})
