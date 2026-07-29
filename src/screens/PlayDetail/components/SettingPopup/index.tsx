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
import SettingMiniPlayer, { SettingLyricGradient } from './settings/SettingMiniPlayer'

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
            <SettingMiniPlayer />
            <SettingLyricGradient />
            <SettingProgressShimmer />
            <SettingLyricProgress />
            <SettingVolume />
            <SettingPlaybackRate />
            <SettingLrcFontSize direction={direction} />
            <SettingLrcAlign />
            <SettingLrcLineCount />
          </View>
              <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
        <Text size={14}>播放器布局</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
          {['default', 'musicfree'].map(layout => (
            <TouchableOpacity
              key={layout}
              onPress={() => updateSetting({ 'playDetail.layout': layout })}
              style={{
                paddingHorizontal: 16, paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: setting['playDetail.layout'] === layout ? '#5B6ABF' : 'rgba(128,128,128,0.2)',
              }}
            >
              <Text color={setting['playDetail.layout'] === layout ? '#fff' : undefined}>
                {layout === 'default' ? '经典' : 'MusicFree 风格'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
      </Popup>
    ) : null
  )
})
