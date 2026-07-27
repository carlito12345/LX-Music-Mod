import { memo, useRef } from 'react'
import { View, StyleSheet } from 'react-native'
import { pop } from '@/navigation'
import StatusBar from '@/components/common/StatusBar'
import { usePlayerMusicInfo } from '@/store/player/hook'
import Text from '@/components/common/Text'
import { scaleSizeH } from '@/utils/pixelRatio'
import { HEADER_HEIGHT as _HEADER_HEIGHT, NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import commonState from '@/store/common/state'
import SettingPopup, { type SettingPopupType } from '../../components/SettingPopup'
import { useStatusbarHeight } from '@/store/common/hook'
import Btn from './Btn'
import { getContrastTextColor, getSecondaryTextColor } from '@/utils/colorContrast'
import { toast } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'

export const HEADER_HEIGHT = scaleSizeH(_HEADER_HEIGHT)

interface HeaderProps {
  backgroundColor: string
}

const Title = ({ backgroundColor }: HeaderProps) => {
  const musicInfo = usePlayerMusicInfo()
  const textColor = getContrastTextColor(backgroundColor)
  const secondaryColor = getSecondaryTextColor(backgroundColor)
  
  return (
    <View style={styles.titleContent}>
      <Text numberOfLines={1} style={styles.title} color={textColor}>{musicInfo.name}</Text>
      <Text numberOfLines={1} style={styles.title} size={12} color={secondaryColor}>{musicInfo.singer}</Text>
    </View>
  )
}

export default memo(({ backgroundColor }: HeaderProps) => {
  const popupRef = useRef<SettingPopupType>(null)
  const statusBarHeight = useStatusbarHeight()
  const controlColor = getContrastTextColor(backgroundColor)

  const back = () => { void pop(commonState.componentIds.playDetail!) }
  const showSetting = () => { popupRef.current?.show() }

  return (
    <View style={{ height: HEADER_HEIGHT + statusBarHeight, paddingTop: statusBarHeight, backgroundColor: 'transparent' }} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_header}>
      <StatusBar />
      <View style={styles.container}>
        <Btn icon="chevron-left" onPress={back} color={controlColor} />
        <Title backgroundColor={backgroundColor} />
        <Btn icon="fullscreen" color={controlColor}
          onPress={() => {
            void import('@/plugins/miniplayer').then(async(mod) => {
              const mp = mod?.default
              if (!mp || !mp.isAvailable) { toast('小窗模式不可用'); return }
              if (!await mp.hasOverlayPermission()) {
                toast('需要悬浮窗权限')
                void mp.openOverlaySettings()
                return
              }
              const showing = mp.isMiniPlayerShowing()
              if (showing) {
                await mp.hide()
                toast('小窗已关闭')
              } else {
                await mp.show()
                toast('小窗已打开')
              }
            })
          }} />
        <Btn icon="slider" onPress={showSetting} color={controlColor} />
      </View>
      <SettingPopup ref={popupRef} direction="vertical" />
    </View>
  )
})

const styles = StyleSheet.create({
  container: { flexDirection: 'row', height: '100%' },
  titleContent: { flex: 1, paddingHorizontal: 5, justifyContent: 'center' },
  title: {},
})
