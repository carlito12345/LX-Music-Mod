import { memo, useRef, useState, useCallback } from 'react'
import { TouchableOpacity, View } from 'react-native'
import TimeoutExitEditModal, { type TimeoutExitEditModalType, useTimeInfo } from '@/components/TimeoutExitEditModal'
import { useTheme } from '@/store/theme/hook'
import { Icon } from '@/components/common/Icon'
import { HEADER_HEIGHT } from './Btn'


export default memo(() => {
  const theme = useTheme()
  const modalRef = useRef<TimeoutExitEditModalType>(null)
  const [modalVisible, setModalVisible] = useState(false)

  const timeInfo = useTimeInfo()

  const handleShow = useCallback(() => {
    console.log('Timer button pressed')
    setModalVisible(true)
    setTimeout(() => {
      modalRef.current?.show()
    }, 100)
  }, [])

  const handleHide = useCallback(() => {
    setModalVisible(false)
  }, [])

  return (
    <View style={{ width: HEADER_HEIGHT, height: '100%' }}>
      <TouchableOpacity 
        onPress={handleShow} 
        style={{ 
          flex: 1,
          justifyContent: 'center', 
          alignItems: 'center' 
        }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Icon name="music_time" color={timeInfo.active ? theme['c-primary-font-active'] : theme['c-button-font']} size={18} />
      </TouchableOpacity>
      {modalVisible && (
        <TimeoutExitEditModal ref={modalRef} timeInfo={timeInfo} onHide={handleHide} />
      )}
    </View>
  )
})
