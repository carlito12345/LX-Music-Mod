import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { ScrollView, View, TouchableOpacity } from 'react-native'
import Text from '@/components/common/Text'
import Popup, { type PopupType, type PopupProps } from '@/components/common/Popup'
import { useI18n } from '@/lang'
import { useSetting } from '@/store/setting/hook'
import { updateSetting } from '@/core/common'

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
import SettingMiniPlayer, { SettingLyricGradient } from './settings/SettingMiniPlayer'
import SettingLayout from './settings/SettingLayout'
import SettingSection from './components/SettingSection'
import { useTheme } from '@/store/theme/hook'

export interface SettingPopupProps extends Omit<PopupProps, 'children'> {
  direction: 'vertical' | 'horizontal'
}

export interface SettingPopupType {
  show: () => void
}

export default forwardRef<SettingPopupType, SettingPopupProps>(({ direction, ...props }, ref) => {
  const theme = useTheme()
  const isDark = !!theme.isDark
  const [visible, setVisible] = useState(false)
  const popupRef = useRef<PopupType>(null)
  const t = useI18n()
  const setting = useSetting()

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
      <Popup ref={popupRef} title={t('play_detail_setting_title')} contentBackgroundColor={isDark ? '#000000' : '#ffffff'} {...props}>
        <ScrollView contentContainerStyle={{ paddingVertical: 8, paddingHorizontal: 12 }}>
          <View onStartShouldSetResponder={() => true}>
            <SettingSection title="播放">
              <SettingVolume />
              <SettingPlaybackRate />
            </SettingSection>

            <SettingSection title="背景">
              <SettingBackground />
              <SettingCover />
            </SettingSection>

            <SettingSection title="歌词">
              <SettingLrcFontSize direction={direction} />
              <SettingLrcAlign />
              <SettingLrcLineCount direction={direction} />
              <SettingLyricProgress />
              <SettingProgressShimmer />
              <SettingLyricGradient />
            </SettingSection>

            <SettingSection title="特效">
              <SettingEffects />
            </SettingSection>

            <SettingSection title="迷你播放器">
              <SettingMiniPlayer />
            </SettingSection>

            <SettingSection title="布局">
              <SettingLayout />
            </SettingSection>

            <SettingSection title="其他">
              <SettingTimer />
            </SettingSection>
          </View>
        </ScrollView>
      </Popup>
    ) : null
  )
})
