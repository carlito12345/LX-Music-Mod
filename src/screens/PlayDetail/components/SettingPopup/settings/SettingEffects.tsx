import { memo, useCallback } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import Text from '@/components/common/Text'
import { updateSetting } from '@/core/common'

// 主特效开关
const MAIN_EFFECTS = [
  { key: 'starfield', label: '🌟 粒子星空', setting: 'playDetail.effect.starfield.enabled' },
  { key: 'lyricStage', label: '🎤 歌词舞台', setting: 'playDetail.effect.lyricStage.enabled' },
  { key: 'cinematic', label: '🎬 镜头转场', setting: 'playDetail.effect.cinematic.enabled' },
  { key: 'controlBtn', label: '🎮 控件动效', setting: 'playDetail.effect.controlBtn.enabled' },
  { key: 'spectrum', label: '📊 频谱', setting: 'playDetail.effect.spectrum.enabled' },
  { key: 'echo', label: '🔊 音域回响', setting: 'playDetail.effect.echo.enabled' },
  { key: 'slideshow', label: '🖼️ 幻灯片', setting: 'playDetail.effect.slideshow.enabled' },
  { key: 'magicRings', label: '💫 点击涟漪', setting: 'playDetail.effect.magicRings.enabled' },
  { key: 'shinyText', label: '✨ 歌名闪光', setting: 'playDetail.effect.shinyText.enabled' },
  { key: 'lyricProximity', label: '🔍 歌词聚焦', setting: 'playDetail.effect.lyricProximity.enabled' },
  { key: 'elasticSlider', label: '🎛️ 弹性进度条', setting: 'playDetail.effect.elasticSlider.enabled' },
] as const

// 粒子控制选项
const PARTICLE_COUNTS = [20, 40, 60, 80]
const PARTICLE_SPEEDS = [
  { label: '0.5x', value: 0.5 },
  { label: '1x', value: 1 },
  { label: '1.5x', value: 1.5 },
  { label: '2x', value: 2 },
]
const AURORA_PRESETS_UI = [
  { label: '极光', value: 'aurora' },
  { label: '日落', value: 'sunset' },
  { label: '海洋', value: 'ocean' },
  { label: '烈焰', value: 'flame' },
  { label: '霓虹', value: 'neon' },
  { label: '糖果', value: 'candy' },
  { label: '流金', value: 'gold' },
  { label: '冰雪', value: 'ice' },
] as const

const PATTERNS = [
  { label: '随机', value: 'random' },
  { label: '星云', value: 'nebula' },
  { label: '螺旋', value: 'spiral' },
] as const

export default memo(() => {
  const theme = useTheme()
  // 读取所有主特效开关
  const starfield = useSettingValue('playDetail.effect.starfield.enabled')
  const lyricStage = useSettingValue('playDetail.effect.lyricStage.enabled')
  const cinematic = useSettingValue('playDetail.effect.cinematic.enabled')
  const controlBtn = useSettingValue('playDetail.effect.controlBtn.enabled')
  const spectrum = useSettingValue('playDetail.effect.spectrum.enabled')
  const echo = useSettingValue('playDetail.effect.echo.enabled')
  const slideshow = useSettingValue('playDetail.effect.slideshow.enabled')
  const magicRings = useSettingValue('playDetail.effect.magicRings.enabled')
  const shinyText = useSettingValue('playDetail.effect.shinyText.enabled')
  const lyricProximity = useSettingValue('playDetail.effect.lyricProximity.enabled')
  const elasticSlider = useSettingValue('playDetail.effect.elasticSlider.enabled')
  const globalAurora = useSettingValue('app.background.aurora.enabled')
  const globalAuroraPreset = useSettingValue('app.background.aurora.preset')
  const globalAuroraIntensity = useSettingValue('app.background.aurora.intensity')

  const echoColor = useSettingValue('playDetail.effect.echo.color')
  const echoSpeed = useSettingValue('playDetail.effect.echo.speed')
  const echoAmplitude = useSettingValue('playDetail.effect.echo.amplitude')

  // 读取粒子参数
  const particleCount = useSettingValue('playDetail.effect.starfield.particleCount')
  const particleSize = useSettingValue('playDetail.effect.starfield.particleSize')
  const speed = useSettingValue('playDetail.effect.starfield.speed')
  const pattern = useSettingValue('playDetail.effect.starfield.pattern')

  const effectMap: Record<string, boolean> = { starfield, lyricStage, cinematic, controlBtn, spectrum, echo, slideshow, magicRings, shinyText, lyricProximity, elasticSlider }

  const getSettingKey = (key: string) => {
    const found = MAIN_EFFECTS.find(e => e.key === key)
    return found ? found.setting : ''
  }

  return (
    <View style={styles.container}>
      <Text size={14} color={theme['c-primary-font']} style={styles.title}>新增特效</Text>
      {/* 全局极光背景(默认开启) */}
      <View style={styles.globalSection}>
        <View style={styles.rowBetween}>
          <Text size={13} color={theme['c-font']}>🌐 全局极光背景</Text>
          <TouchableOpacity
            style={[styles.chip, globalAurora && { backgroundColor: theme['c-primary'] }]}
            onPress={() => updateSetting({ 'app.background.aurora.enabled': !globalAurora } as any)}
          >
            <Text size={12} color={globalAurora ? '#fff' : theme['c-font']}>{globalAurora ? '已开启' : '已关闭'}</Text>
          </TouchableOpacity>
        </View>
        {globalAurora && (
          <>
            <Text size={12} color={theme['c-font-label']} style={{ marginTop: 6, marginBottom: 4 }}>配色</Text>
            <View style={styles.row}>
              {AURORA_PRESETS_UI.map(p => (
                <TouchableOpacity
                  key={p.value}
                  style={[styles.chip, globalAuroraPreset === p.value && { backgroundColor: theme['c-primary'] }]}
                  onPress={() => updateSetting({ 'app.background.aurora.preset': p.value } as any)}
                >
                  <Text size={11} color={globalAuroraPreset === p.value ? '#fff' : theme['c-font']}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text size={12} color={theme['c-font-label']} style={{ marginTop: 4, marginBottom: 4 }}>强度</Text>
            <View style={styles.row}>
              {[0.3, 0.5, 0.75, 1].map(v => (
                <TouchableOpacity
                  key={v}
                  style={[styles.chip, globalAuroraIntensity === v && { backgroundColor: theme['c-primary'] }]}
                  onPress={() => updateSetting({ 'app.background.aurora.intensity': v } as any)}
                >
                  <Text size={11} color={globalAuroraIntensity === v ? '#fff' : theme['c-font']}>{v}x</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>
      <View style={styles.row}>
        {MAIN_EFFECTS.map(e => {
          const isOn = effectMap[e.key]
          return (
            <TouchableOpacity
              key={e.key}
              style={[styles.chip, isOn && { backgroundColor: theme['c-primary'] }]}
              onPress={() => updateSetting({ [e.setting]: !isOn } as any)}
            >
              <Text size={12} color={isOn ? '#fff' : theme['c-font']}>{e.label}</Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* 粒子控制 - 仅在粒子星空开启时显示 */}
      {starfield && (
        <View style={styles.subSection}>
          {/* 粒子数量 */}
          <Text size={13} color={theme['c-font-label']} style={{ marginBottom: 6 }}>粒子数量</Text>
          <View style={styles.row}>
            {PARTICLE_COUNTS.map(n => (
              <TouchableOpacity
                key={n}
                style={[styles.chip, particleCount === n && { backgroundColor: theme['c-primary'] }]}
                onPress={() => updateSetting({ 'playDetail.effect.starfield.particleCount': n } as any)}
              >
                <Text size={12} color={particleCount === n ? '#fff' : theme['c-font']}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 粒子大小 */}
          <Text size={13} color={theme['c-font-label']} style={{ marginBottom: 6, marginTop: 4 }}>粒子大小</Text>
          <View style={styles.row}>
            {[1, 2, 3, 4].map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, particleSize === s && { backgroundColor: theme['c-primary'] }]}
                onPress={() => updateSetting({ 'playDetail.effect.starfield.particleSize': s } as any)}
              >
                <Text size={12} color={particleSize === s ? '#fff' : theme['c-font']}>{'●'.repeat(s)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 动画速度 */}
          <Text size={13} color={theme['c-font-label']} style={{ marginBottom: 6, marginTop: 4 }}>动画速度</Text>
          <View style={styles.row}>
            {PARTICLE_SPEEDS.map(s => (
              <TouchableOpacity
                key={s.value}
                style={[styles.chip, speed === s.value && { backgroundColor: theme['c-primary'] }]}
                onPress={() => updateSetting({ 'playDetail.effect.starfield.speed': s.value } as any)}
              >
                <Text size={12} color={speed === s.value ? '#fff' : theme['c-font']}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 图案样式 */}
          <Text size={13} color={theme['c-font-label']} style={{ marginBottom: 6, marginTop: 4 }}>图案样式</Text>
          <View style={styles.row}>
            {PATTERNS.map(p => (
              <TouchableOpacity
                key={p.value}
                style={[styles.chip, pattern === p.value && { backgroundColor: theme['c-primary'] }]}
                onPress={() => updateSetting({ 'playDetail.effect.starfield.pattern': p.value } as any)}
              >
                <Text size={12} color={pattern === p.value ? '#fff' : theme['c-font']}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
      {echo && (
        <View style={styles.subSection}>
          <Text size={13} color={theme['c-font-label']} style={{ marginBottom: 6 }}>音域回响颜色</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.chip, !echoColor && { backgroundColor: theme['c-primary'] }]}
              onPress={() => updateSetting({ 'playDetail.effect.echo.color': '' } as any)}
            >
              <Text size={12} color={!echoColor ? '#fff' : theme['c-font']}>自动</Text>
            </TouchableOpacity>
            {['#6366f1','#10b981','#ef4444','#06b6d4','#f59e0b','#ec4899','#888'].map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.colorDot, { backgroundColor: c }, echoColor === c && styles.colorDotActive]}
                onPress={() => updateSetting({ 'playDetail.effect.echo.color': c } as any)}
              />
            ))}
          </View>
          {/* 波浪速度 */}
          <View style={styles.row}>
            <Text size={12} color={theme['c-font-label']} style={{ marginRight: 8 }}>速度</Text>
            {[0.5, 0.75, 1, 1.5, 2].map(v => (
              <TouchableOpacity
                key={v}
                style={[styles.chip, echoSpeed === v && { backgroundColor: theme['c-primary'] }]}
                onPress={() => updateSetting({ 'playDetail.effect.echo.speed': v } as any)}
              >
                <Text size={11} color={echoSpeed === v ? '#fff' : theme['c-font']}>{v}x</Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* 跳动幅度 */}
          <View style={styles.row}>
            <Text size={12} color={theme['c-font-label']} style={{ marginRight: 8 }}>幅度</Text>
            {[0.5, 0.75, 1, 1.5, 2].map(v => (
              <TouchableOpacity
                key={v}
                style={[styles.chip, echoAmplitude === v && { backgroundColor: theme['c-primary'] }]}
                onPress={() => updateSetting({ 'playDetail.effect.echo.amplitude': v } as any)}
              >
                <Text size={11} color={echoAmplitude === v ? '#fff' : theme['c-font']}>{v}x</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
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
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  subSection: {
    marginLeft: 8,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(128,128,128,0.2)',
  },
  globalSection: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(128,128,128,0.12)',
    marginBottom: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
