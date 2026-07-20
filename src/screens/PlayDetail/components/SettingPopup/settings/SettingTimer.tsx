import { memo, useRef, useState, useCallback } from 'react'
import { View, TouchableOpacity } from 'react-native'
import TimeoutExitEditModal, { type TimeoutExitEditModalType, useTimeInfo } from '@/components/TimeoutExitEditModal'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'

export default memo(() => {
  const theme = useTheme()
  const modalRef = useRef<TimeoutExitEditModalType>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const timeInfo = useTimeInfo()

  const handleShow = useCallback(() => {
    setModalVisible(true)
    setTimeout(() => { modalRef.current?.show() }, 100)
  }, [])

  const handleHide = useCallback(() => { setModalVisible(false) }, [])

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.row} onPress={handleShow} activeOpacity={0.6}>
        <Icon name="music_time" color={timeInfo.active ? theme['c-primary-font-active'] : theme['c-font']} size={20} />
        <Text size={14} color={theme['c-font']} style={styles.label}>
          {timeInfo.active ? '定时停止中' : '定时停止'}
        </Text>
        <Text size={12} color={theme['c-font-label']} style={styles.hint}>点击设置</Text>
      </TouchableOpacity>
      {modalVisible && <TimeoutExitEditModal ref={modalRef} timeInfo={timeInfo} onHide={handleHide} />}
    </View>
  )
})

const styles = createStyle({
  container: { paddingHorizontal: 15, paddingVertical: 8 },
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
  hint: {},
})
