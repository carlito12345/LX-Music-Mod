/**
 * IsGlobalAurora - 全局极光背景(默认开启)
 * 开关 + 配色 + 强度
 */
import { memo } from 'react'
import { View, TouchableOpacity } from 'react-native'
import CheckBoxItem from '../../components/CheckBoxItem'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { updateSetting } from '@/core/common'
import { useSettingValue } from '@/store/setting/hook'

const AURORA_PRESETS = [
  { label: '极光', value: 'aurora' },
  { label: '日落', value: 'sunset' },
  { label: '海洋', value: 'ocean' },
  { label: '烈焰', value: 'flame' },
  { label: '霓虹', value: 'neon' },
  { label: '糖果', value: 'candy' },
  { label: '流金', value: 'gold' },
  { label: '冰雪', value: 'ice' },
] as const

export default memo(() => {
  const theme = useTheme()
  const enabled = useSettingValue('app.background.aurora.enabled')
  const preset = useSettingValue('app.background.aurora.preset')
  const intensity = useSettingValue('app.background.aurora.intensity')

  return (
    <View style={styles.content}>
      <CheckBoxItem
        check={enabled}
        label="全局极光背景"
        onChange={(v) => updateSetting({ 'app.background.aurora.enabled': v })}
      />
      {enabled ? (
        <View style={styles.options}>
          <Text size={12} color={theme['c-font-label']} style={styles.optionLabel}>配色</Text>
          <View style={styles.row}>
            {AURORA_PRESETS.map(p => {
              const active = preset === p.value
              return (
                <TouchableOpacity
                  key={p.value}
                  onPress={() => updateSetting({ 'app.background.aurora.preset': p.value })}
                  style={[styles.chip, active && { backgroundColor: theme['c-primary'] }]}
                >
                  <Text size={11} color={active ? '#fff' : theme['c-font']}>{p.label}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
          <Text size={12} color={theme['c-font-label']} style={styles.optionLabel}>强度</Text>
          <View style={styles.row}>
            {[0.3, 0.5, 0.75, 1].map(v => {
              const active = intensity === v
              return (
                <TouchableOpacity
                  key={v}
                  onPress={() => updateSetting({ 'app.background.aurora.intensity': v })}
                  style={[styles.chip, active && { backgroundColor: theme['c-primary'] }]}
                >
                  <Text size={11} color={active ? '#fff' : theme['c-font']}>{v}x</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      ) : null}
    </View>
  )
})

const styles = createStyle({
  content: {
    marginTop: 5,
  },
  options: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  optionLabel: {
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(128,128,128,0.15)',
  },
})
