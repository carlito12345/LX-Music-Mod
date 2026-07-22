import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { ScrollView, View } from 'react-native'
import Popup, { type PopupType, type PopupProps } from '@/components/common/Popup'
import { useI18n } from '@/lang'

import SettingTimer from './settings/SettingTimer'
import SettingBackground from './settings/SettingBackground'
import SettingCover from './settings/SettingCover'
import SettingProgressShimmer from './settings/SettingProgressShimmer'
import SettingLyricProgress from './settings/SettingLyricProgress'
import SettingVolume from './settings/SettingVolume'
import SettingPlaybackRate from './settings/SettingPlaybackRate'
import SettingLrcFontSize from './settings/SettingLrcFontSize'
import SettingLrcAlign from './settings/SettingLrcAlign'
import SettingLrcLineCount from './settings/SettingLrcLineCount'
import SettingEffects from './settings/SettingEffects'

export interface SettingPopupProps extends Omit<PopupProps, 'children'> {
  direction: 'vertical' | 'horizontal'
}

export interface SettingPopupType {
  show: () => void
}

export default forwardRef<SettingPopupType, SettingPopupProps>(({ direction, ...props }, ref) => {
  const [visible, setVisible] = useState(false)
  const popupRef = useRef<PopupType>(null)
  const t = useI18n()

  useImperativeHandle(ref, () => ({
    show() {
      if (visible) popupRef.current?.setVisible(true)
      else {
        setVisible(true)
        requestAnimationFrame(() => { popupRef.current?.setVisible(true) })
      }
    },
  }))

  return (
    visible ? (
      <Popup ref={popupRef} title={t('play_detail_setting_title')} {...props}>
        <ScrollView>
          <View onStartShouldSetResponder={() => true}>
            <SettingTimer />
            <SettingBackground />
            <SettingCover />
            <SettingEffects />
            <SettingProgressShimmer />
            <SettingLyricProgress />
            <SettingVolume />
            <SettingPlaybackRate />
            <SettingLrcFontSize direction={direction} />
            <SettingLrcAlign />
            <SettingLrcLineCount />
          </View>
        </ScrollView>
      </Popup>
    ) : null
  )
})
