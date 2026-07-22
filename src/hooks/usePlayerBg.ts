/**
 * usePlayerBg - 获取当前播放器的背景设置
 * 跟随播放器设置中的背景模式
 */
import { useMemo } from 'react'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import { usePlayerMusicInfo } from '@/store/player/hook'

export function usePlayerBg() {
  const theme = useTheme()
  const mi = usePlayerMusicInfo()
  const bgType = useSettingValue('playDetail.background.type')
  const solidColor = useSettingValue('playDetail.background.solidColor')
  const followCover = useSettingValue('playDetail.background.followCover')
  const wallpaperEnabled = useSettingValue('playDetail.effect.wallpaper.enabled')

  const bgColor = useMemo(() => {
    if (wallpaperEnabled) return '#1a1a2e'
    if (bgType === 'solid') {
      if (followCover && mi.pic) return '#1a1a2e' // 封面主色跟随需要在 native 层实现
      return solidColor || theme['c-content-background']
    }
    return theme['c-content-background']
  }, [wallpaperEnabled, bgType, followCover, mi.pic, solidColor, theme])

  return { bgColor }
}
