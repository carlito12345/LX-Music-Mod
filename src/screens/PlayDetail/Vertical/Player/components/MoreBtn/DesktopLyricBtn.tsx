import Btn from './Btn'
import { useSettingValue } from '@/store/setting/hook'
import DesktopLyricEnable, { type DesktopLyricEnableType } from '@/components/DesktopLyricEnable'
import { memo, useRef } from 'react'
import { toggleDesktopLyricLock } from '@/core/desktopLyric'
import { getContrastTextColor } from '@/utils/colorContrast'

interface DesktopLyricBtnProps {
  backgroundColor: string
}

export default memo(({ backgroundColor }: DesktopLyricBtnProps) => {
  const desktopLyricEnable = useSettingValue('desktopLyric.enable')
  const desktopLyricEnableRef = useRef<DesktopLyricEnableType>(null)
  const iconColor = getContrastTextColor(backgroundColor)

  const handleToggleDesktopLyric = () => {
    desktopLyricEnableRef.current?.setEnabled(!desktopLyricEnable)
  }

  const handleToggleDesktopLyricLock = () => {
    toggleDesktopLyricLock()
  }

  return (
    <>
      <Btn icon={desktopLyricEnable ? 'lyric-on' : 'lyric-off'} onPress={handleToggleDesktopLyric} onLongPress={handleToggleDesktopLyricLock} color={iconColor} />
      <DesktopLyricEnable ref={desktopLyricEnableRef} />
    </>
  )
})
