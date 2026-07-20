import { memo, useCallback } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import Text from '@/components/common/Text'
import { updateSetting } from '@/core/common'

const COVER_STYLES = [
  { id: 'circle', label: '圆形' },
  { id: 'square', label: '方形' },
  { id: 'rounded', label: '圆角' },
  { id: 'vinyl', label: '黑胶' },
] as const

const EFFECTS = [
  { key: 'glow', label: '发光' },
  { key: 'particles', label: '粒子' },
  { key: 'rotate', label: '旋转' },
  { key: 'swipe', label: '滑动' },
] as const

export default memo(() => {
  const theme = useTheme()
  const coverStyle = useSettingValue('playDetail.cover.style')
  const effectGlow = useSettingValue('playDetail.cover.effect.glow')
  const effectParticles = useSettingValue('playDetail.cover.effect.particles')
  const effectRotate = useSettingValue('playDetail.cover.effect.rotate')
  const effectSwipe = useSettingValue('playDetail.cover.effect.swipe')

  const effects = { glow: effectGlow, particles: effectParticles, rotate: effectRotate, swipe: effectSwipe }

  const handleStyleChange = useCallback((style: LX.AppSetting['playDetail.cover.style']) => {
    updateSetting({ 'playDetail.cover.style': style })
  }, [])

  const handleEffectToggle = useCallback((key: string) => {
    updateSetting({ [`playDetail.cover.effect.${key}`]: !effects[key as keyof typeof effects] })
  }, [effects])

  return (
    <View style={styles.container}>
      <Text size={14} color={theme['c-primary-font']} style={styles.title}>封面样式</Text>
      <View style={styles.row}>
        {COVER_STYLES.map(s => (
          <TouchableOpacity
            key={s.id}
            style={[styles.chip, coverStyle === s.id && { backgroundColor: theme['c-primary'] }]}
            onPress={() => handleStyleChange(s.id)}
          >
            <Text size={12} color={coverStyle === s.id ? '#fff' : theme['c-font']}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text size={14} color={theme['c-primary-font']} style={styles.title}>特效开关</Text>
      <View style={styles.row}>
        {EFFECTS.map(e => (
          <TouchableOpacity
            key={e.key}
            style={[styles.chip, effects[e.key as keyof typeof effects] && { backgroundColor: theme['c-primary'] }]}
            onPress={() => handleEffectToggle(e.key)}
          >
            <Text size={12} color={effects[e.key as keyof typeof effects] ? '#fff' : theme['c-font']}>{e.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
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
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(128,128,128,0.15)',
  },
})
