import { memo, useCallback } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import Text from '@/components/common/Text'
import { updateSetting } from '@/core/common'

const BG_TYPES = [
  { id: 'theme', label: '跟随主题' },
  { id: 'follow', label: '封面主色' },
  { id: 'blur', label: '封面模糊' },
  { id: 'wallpaper', label: '星云壁纸' },
] as const

const SOLID_COLORS = [
  { label: '深蓝', value: '#1a1a2e' },
  { label: '深空黑', value: '#0d1117' },
  { label: '暗夜紫', value: '#1a0d2e' },
  { label: '墨绿', value: '#0d2818' },
  { label: '酒红', value: '#2e0d1a' },
  { label: '深灰', value: '#1c1c1c' },
  { label: '午夜蓝', value: '#0d1b2a' },
  { label: '炭黑', value: '#121212' },
] as const

const WALLPAPER_COLORS = [
  { label: '主题色', value: '' },
  { label: '靛蓝', value: '#6366f1' },
  { label: '翡翠', value: '#10b981' },
  { label: '烈焰', value: '#ef4444' },
  { label: '极光', value: '#06b6d4' },
  { label: '暖阳', value: '#f59e0b' },
  { label: '粉紫', value: '#ec4899' },
  { label: '渐变', value: 'gradient' },
] as const

export default memo(() => {
  const theme = useTheme()
  const bgType = useSettingValue('playDetail.background.type')
  const followCover = useSettingValue('playDetail.background.followCover')
  const wallpaperEnabled = useSettingValue('playDetail.effect.wallpaper.enabled')
  const wallpaperColor = useSettingValue('playDetail.effect.wallpaper.color')
  const solidColor = useSettingValue('playDetail.background.solidColor')

  const activeMode = wallpaperEnabled ? 'wallpaper'
    : bgType === 'solid' && followCover ? 'follow' : bgType

  const handleTypeChange = useCallback((mode: string) => {
    if (mode === 'wallpaper') {
      updateSetting({ 'playDetail.effect.wallpaper.enabled': true })
    } else {
      updateSetting({ 'playDetail.effect.wallpaper.enabled': false })
      if (mode === 'follow') {
        updateSetting({
          'playDetail.background.type': 'solid',
          'playDetail.background.followCover': true,
        })
      } else {
        updateSetting({
          'playDetail.background.type': mode as LX.AppSetting['playDetail.background.type'],
          'playDetail.background.followCover': false,
        })
      }
    }
  }, [])

  return (
    <View style={styles.container}>
      <Text size={14} color={theme['c-primary-font']} style={styles.title}>背景模式</Text>
      <View style={styles.row}>
        {BG_TYPES.map(type => (
          <TouchableOpacity
            key={type.id}
            style={[styles.chip, activeMode === type.id && { backgroundColor: theme['c-primary'] }]}
            onPress={() => handleTypeChange(type.id)}
          >
            <Text size={12} color={activeMode === type.id ? '#fff' : theme['c-font']}>{type.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeMode === 'wallpaper' && (
        <>
          <Text size={13} color={theme['c-font-label']} style={{ marginBottom: 6, marginTop: 8 }}>壁纸颜色</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.chip, wallpaperColor === '' && { backgroundColor: theme['c-primary'] }]}
              onPress={() => updateSetting({ 'playDetail.effect.wallpaper.color': '' } as any)}
            >
              <Text size={11} color={wallpaperColor === '' ? '#fff' : theme['c-font']}>主题色</Text>
            </TouchableOpacity>
            {WALLPAPER_COLORS.slice(1).map(c => (
              <TouchableOpacity
                key={c.value}
                style={[styles.colorDot, { backgroundColor: c.value === 'gradient' ? '#000' : c.value }, wallpaperColor === c.value && styles.colorDotActive]}
                onPress={() => updateSetting({ 'playDetail.effect.wallpaper.color': c.value } as any)}
              />
            ))}
          </View>
        </>
      )}

      {activeMode === 'solid' && (
        <>
          <Text size={13} color={theme['c-font-label']} style={{ marginBottom: 6, marginTop: 8 }}>纯色背景</Text>
          <View style={styles.row}>
            {SOLID_COLORS.map(c => (
              <TouchableOpacity
                key={c.value}
                style={[styles.colorDot, { backgroundColor: c.value }, solidColor === c.value && styles.colorDotActive]}
                onPress={() => updateSetting({ 'playDetail.background.solidColor': c.value } as any)}
              >
                <Text size={10} color="#fff" style={{ textAlign: 'center', lineHeight: 24 }}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </View>
  )
})

const styles = createStyle({
  container: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  title: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(128,128,128,0.15)',
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotActive: {
    borderColor: '#fff',
    borderWidth: 3,
  },
})
