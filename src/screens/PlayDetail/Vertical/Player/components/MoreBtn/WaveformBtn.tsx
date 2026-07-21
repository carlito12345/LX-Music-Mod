import { memo } from 'react'
import { TouchableOpacity } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import { updateSetting } from '@/core/common'
import { createStyle } from '@/utils/tools'
import { Icon } from '@/components/common/Icon'

export default memo(() => {
  const theme = useTheme()
  const enabled = useSettingValue('playDetail.audioWaveform.enabled')

  const toggle = () => {
    updateSetting({ 'playDetail.audioWaveform.enabled': !enabled })
  }

  return (
    <TouchableOpacity style={styles.btn} onPress={toggle} activeOpacity={0.7}>
      <Icon
        name="playback-rate"
        size={22}
        color={enabled ? theme['c-primary'] : theme['c-font-label']}
      />
    </TouchableOpacity>
  )
})

const styles = createStyle({
  btn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
