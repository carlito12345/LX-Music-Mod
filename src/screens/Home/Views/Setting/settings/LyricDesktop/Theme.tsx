import { updateSetting } from '@/core/common'
import { setDesktopLyricColor, setDesktopLyricGradient } from '@/core/desktopLyric'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'
import { memo, useRef } from 'react'
import { StyleSheet, View, TouchableOpacity } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'

import SubTitle from '../../components/SubTitle'
import CustomGradient, { type CustomGradientType, type GradientStop } from './CustomGradient'

interface ThemeDef {
  name: string
  playedColor: string
  shadowColor: string
  gradientColors?: string[]
  gradientPositions?: number[]
}

const themes: ThemeDef[] = [
  { name: 'green', playedColor: '#08e664', shadowColor: 'rgba(0,0,0,0.6)' },
  { name: 'yellow', playedColor: '#fffa12', shadowColor: 'rgba(0,0,0,0.6)' },
  { name: 'blue', playedColor: '#019ce4', shadowColor: 'rgba(0,0,0,0.6)' },
  { name: 'red', playedColor: '#ff1222', shadowColor: 'rgba(0,0,0,0.6)' },
  { name: 'pink', playedColor: '#ef6976', shadowColor: 'rgba(0,0,0,0.6)' },
  { name: 'purple', playedColor: '#c851d4', shadowColor: 'rgba(0,0,0,0.6)' },
  { name: 'orange', playedColor: '#ffa600', shadowColor: 'rgba(0,0,0,0.6)' },
  { name: 'black', playedColor: '#000000', shadowColor: '#ffffff' },
  { name: 'white', playedColor: '#ffffff', shadowColor: 'rgba(0,0,0,0.6)' },
  {
    name: '流光溢彩',
    playedColor: '#00f2ff',
    shadowColor: 'rgba(255,0,170,0.55)',
    gradientColors: ['#00f2ff', '#0072ff', '#7b2cbf', '#ff00aa', '#ffd500'],
    gradientPositions: [0, 0.25, 0.5, 0.75, 1],
  },
  {
    name: '霓虹幻彩',
    playedColor: '#ff0055',
    shadowColor: 'rgba(0,200,255,0.55)',
    gradientColors: ['#ff0055', '#ff00aa', '#aa00ff', '#00aaff', '#00ffaa'],
    gradientPositions: [0, 0.25, 0.5, 0.75, 1],
  },
]

const GradientPreview = ({ colors }: { colors: string[] }) => {
  return (
    <View style={styles.image}>
      {colors.map((c, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${(i / colors.length) * 100}%`,
            bottom: `${100 - ((i + 1) / colors.length) * 100}%`,
            backgroundColor: c,
          }}
        />
      ))}
    </View>
  )
}

const ThemeItem = ({ theme, change }: {
  theme: ThemeDef
  change: (theme: ThemeDef) => void
}) => {
  return (
    <TouchableOpacity style={styles.item} activeOpacity={0.5} onPress={() => { change(theme) }}>
      <View style={styles.colorContent}>
        {theme.gradientColors
          ? <GradientPreview colors={theme.gradientColors} />
          : <View style={{ ...styles.image, backgroundColor: theme.playedColor }} />}
      </View>
    </TouchableOpacity>
  )
}

export default memo(() => {
  const t = useI18n()
  const gradientColors = useSettingValue('desktopLyric.style.lyricGradientColors')
  const gradientPositions = useSettingValue('desktopLyric.style.lyricGradientPositions')
  const customRef = useRef<CustomGradientType>(null)

  const applyTheme = (theme: ThemeDef) => {
    void setDesktopLyricColor(null, theme.playedColor, theme.shadowColor).then(() => {
      return setDesktopLyricGradient(theme.gradientColors ?? null, theme.gradientPositions ?? null)
    }).then(() => {
      updateSetting({
        'desktopLyric.style.lyricPlayedColor': theme.playedColor,
        'desktopLyric.style.lyricShadowColor': theme.shadowColor,
        'desktopLyric.style.lyricGradientColors': theme.gradientColors ?? null,
        'desktopLyric.style.lyricGradientPositions': theme.gradientPositions ?? null,
      })
    })
  }

  const openCustom = () => {
    customRef.current?.setVisible(true)
  }

  const handleCustomSave = (stops: GradientStop[]) => {
    const colors = stops.map(s => s.color)
    const positions = stops.map(s => s.position)
    const playedColor = colors[0] ?? '#00f2ff'
    const shadowColor = 'rgba(0,0,0,0.5)'
    void setDesktopLyricColor(null, playedColor, shadowColor).then(() => {
      return setDesktopLyricGradient(colors, positions)
    }).then(() => {
      updateSetting({
        'desktopLyric.style.lyricPlayedColor': playedColor,
        'desktopLyric.style.lyricShadowColor': shadowColor,
        'desktopLyric.style.lyricGradientColors': colors,
        'desktopLyric.style.lyricGradientPositions': positions,
      })
    })
  }

  const customStops: GradientStop[] = (gradientColors ?? []).map((c, i) => ({
    color: c,
    position: gradientPositions?.[i] ?? (i / Math.max(1, (gradientColors ?? []).length - 1)),
  }))

  return (
    <SubTitle title={t('setting_lyric_desktop_theme')}>
      <View style={styles.list}>
        {
          themes.map((c, i) => <ThemeItem key={i.toString()} theme={c} change={applyTheme} />)
        }
        <TouchableOpacity style={styles.item} activeOpacity={0.5} onPress={openCustom}>
          <View style={styles.colorContent}>
            <View style={{ ...styles.image, ...styles.customImage, borderColor: 'rgba(255,255,255,0.4)' }}>
              {gradientColors && gradientColors.length >= 2
                ? <GradientPreview colors={gradientColors} />
                : <View style={{ ...styles.image, backgroundColor: 'transparent' }} />}
              <View style={styles.customLabel}>
                <Text size={10} color="rgba(255,255,255,0.9)">+</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>
      <CustomGradient ref={customRef} initialStops={customStops} onSave={handleCustomSave} />
    </SubTitle>
  )
})

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  item: {
    marginRight: 15,
    marginTop: 5,
    alignItems: 'center',
    width: 26,
  },
  colorContent: {
    width: 26,
    height: 26,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 20,
    height: 20,
    borderRadius: 4,
    elevation: 1,
    overflow: 'hidden',
  },
  customImage: {
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customLabel: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
})
