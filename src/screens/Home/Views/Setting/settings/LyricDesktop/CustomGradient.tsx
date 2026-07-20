import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { View, TouchableOpacity, ScrollView } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'
import Button from '@/components/common/Button'
import Dialog, { type DialogType } from '@/components/common/Dialog'
import Slider from '@react-native-community/slider'

export interface GradientStop {
  color: string
  position: number
}

export interface CustomGradientProps {
  initialStops: GradientStop[]
  onSave: (stops: GradientStop[]) => void
}

export interface CustomGradientType {
  setVisible: (visible: boolean) => void
}

const hex = (n: number) => {
  const s = Math.round(Math.max(0, Math.min(255, n))).toString(16)
  return s.length === 1 ? '0' + s : s
}
const rgbaToHex = (r: number, g: number, b: number, a: number) => {
  return '#' + hex(r) + hex(g) + hex(b) + hex(a * 255)
}
const parseRgba = (color: string) => {
  if (color.startsWith('#')) {
    const c = color.replace('#', '')
    if (c.length === 6) return { r: parseInt(c.slice(0, 2), 16), g: parseInt(c.slice(2, 4), 16), b: parseInt(c.slice(4, 6), 16), a: 1 }
    if (c.length === 8) return { r: parseInt(c.slice(0, 2), 16), g: parseInt(c.slice(2, 4), 16), b: parseInt(c.slice(4, 6), 16), a: parseInt(c.slice(6, 8), 16) / 255 }
  }
  const m = color.match(/rgba?\s*\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\s*\)/)
  if (m) return { r: parseInt(m[1]), g: parseInt(m[2]), b: parseInt(m[3]), a: m[4] ? parseFloat(m[4]) : 1 }
  return { r: 0, g: 200, b: 255, a: 1 }
}

const GradientPreview = ({ stops }: { stops: GradientStop[] }) => {
  const sorted = useMemo(() => [...stops].sort((a, b) => a.position - b.position), [stops])
  return (
    <View style={styles.previewBox}>
      {sorted.map((s, i) => {
        const prev = i === 0 ? 0 : sorted[i - 1].position
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: `${prev * 100}%`,
              right: `${100 - s.position * 100}%`,
              top: 0,
              bottom: 0,
              backgroundColor: s.color,
            }}
          />
        )
      })}
    </View>
  )
}

export default forwardRef<CustomGradientType, CustomGradientProps>(({ initialStops, onSave }, ref) => {
  const theme = useTheme()
  const t = useI18n()
  const dialogRef = useRef<DialogType>(null)
  const [stops, setStops] = useState<GradientStop[]>(initialStops.length >= 2 ? initialStops : [
    { color: '#00f2ff', position: 0 },
    { color: '#ff00aa', position: 1 },
  ])
  const [selectedIndex, setSelectedIndex] = useState(0)

  useImperativeHandle(ref, () => ({
    setVisible(visible: boolean) {
      dialogRef.current?.setVisible(visible)
      if (visible) setStops(initialStops.length >= 2 ? initialStops : stops)
    },
  }))

  const selected = stops[selectedIndex] ?? stops[0]
  const rgba = useMemo(() => parseRgba(selected.color), [selected.color])

  const updateSelectedColor = useCallback((r: number, g: number, b: number, a: number) => {
    setStops(prev => prev.map((s, i) => i === selectedIndex ? { ...s, color: rgbaToHex(r, g, b, a) } : s))
  }, [selectedIndex])

  const updateSelectedPosition = useCallback((pos: number) => {
    setStops(prev => prev.map((s, i) => i === selectedIndex ? { ...s, position: pos } : s))
  }, [selectedIndex])

  const addStop = useCallback(() => {
    setStops(prev => {
      const pos = Math.round((prev[prev.length - 1]?.position ?? 0.5) * 100) / 100
      const newPos = Math.min(1, pos + 0.1)
      const newStops = [...prev, { color: '#ffffff', position: newPos }]
      return newStops
    })
    setSelectedIndex(stops.length)
  }, [stops.length])

  const removeStop = useCallback((idx: number) => {
    if (stops.length <= 2) return
    setStops(prev => prev.filter((_, i) => i !== idx))
    if (selectedIndex >= idx && selectedIndex > 0) setSelectedIndex(selectedIndex - 1)
  }, [selectedIndex, stops.length])

  const handleSave = useCallback(() => {
    const sorted = [...stops].sort((a, b) => a.position - b.position)
    onSave(sorted)
    dialogRef.current?.setVisible(false)
  }, [stops, onSave])

  return (
    <Dialog ref={dialogRef} title={t('setting_lyric_desktop_theme_custom') || '自定义渐变'} bgHide>
      <View style={styles.container}>
        <GradientPreview stops={stops} />

        <ScrollView style={styles.scroll} keyboardShouldPersistTaps="always">
          <View style={styles.stopList}>
            {stops.map((s, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.stopRow, selectedIndex === i && { backgroundColor: theme['c-primary-background-active'] }]}
                onPress={() => setSelectedIndex(i)}
                activeOpacity={0.6}
              >
                <View style={{ ...styles.stopColor, backgroundColor: s.color }} />
                <View style={styles.stopInfo}>
                  <Text size={12} color={theme['c-primary-font']}>{s.color}</Text>
                  <Text size={12} color={theme['c-font-label']}>{Math.round(s.position * 100)}%</Text>
                </View>
                {stops.length > 2 && (
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => removeStop(i)}>
                    <Text size={12} color={theme['c-button-font']}>✕</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.addBtn} onPress={addStop} activeOpacity={0.6}>
            <Text size={13} color={theme['c-primary-font']}>+ {t('add') || '添加颜色'}</Text>
          </TouchableOpacity>

          <View style={styles.editor}>
            <Text size={13} color={theme['c-primary-font']} style={styles.editorTitle}>{t('edit_color') || '编辑颜色'}</Text>
            <View style={styles.sliderRow}>
              <Text size={12} color={theme['c-font-label']} style={styles.sliderLabel}>R</Text>
              <Slider
                value={rgba.r}
                minimumValue={0}
                maximumValue={255}
                step={1}
                onValueChange={(v: number) => updateSelectedColor(v, rgba.g, rgba.b, rgba.a)}
                style={styles.slider}
                minimumTrackTintColor={theme['c-button-background-active']}
                maximumTrackTintColor={theme['c-button-background']}
                thumbTintColor={theme['c-primary-light-100']}
              />
              <Text size={12} color={theme['c-primary-font']} style={styles.sliderValue}>{rgba.r}</Text>
            </View>
            <View style={styles.sliderRow}>
              <Text size={12} color={theme['c-font-label']} style={styles.sliderLabel}>G</Text>
              <Slider
                value={rgba.g}
                minimumValue={0}
                maximumValue={255}
                step={1}
                onValueChange={(v: number) => updateSelectedColor(rgba.r, v, rgba.b, rgba.a)}
                style={styles.slider}
                minimumTrackTintColor={theme['c-button-background-active']}
                maximumTrackTintColor={theme['c-button-background']}
                thumbTintColor={theme['c-primary-light-100']}
              />
              <Text size={12} color={theme['c-primary-font']} style={styles.sliderValue}>{rgba.g}</Text>
            </View>
            <View style={styles.sliderRow}>
              <Text size={12} color={theme['c-font-label']} style={styles.sliderLabel}>B</Text>
              <Slider
                value={rgba.b}
                minimumValue={0}
                maximumValue={255}
                step={1}
                onValueChange={(v: number) => updateSelectedColor(rgba.r, rgba.g, v, rgba.a)}
                style={styles.slider}
                minimumTrackTintColor={theme['c-button-background-active']}
                maximumTrackTintColor={theme['c-button-background']}
                thumbTintColor={theme['c-primary-light-100']}
              />
              <Text size={12} color={theme['c-primary-font']} style={styles.sliderValue}>{rgba.b}</Text>
            </View>
            <View style={styles.sliderRow}>
              <Text size={12} color={theme['c-font-label']} style={styles.sliderLabel}>A</Text>
              <Slider
                value={rgba.a}
                minimumValue={0}
                maximumValue={1}
                step={0.01}
                onValueChange={(v: number) => updateSelectedColor(rgba.r, rgba.g, rgba.b, v)}
                style={styles.slider}
                minimumTrackTintColor={theme['c-button-background-active']}
                maximumTrackTintColor={theme['c-button-background']}
                thumbTintColor={theme['c-primary-light-100']}
              />
              <Text size={12} color={theme['c-primary-font']} style={styles.sliderValue}>{Math.round(rgba.a * 100)}%</Text>
            </View>
            <View style={styles.sliderRow}>
              <Text size={12} color={theme['c-font-label']} style={styles.sliderLabel}>{t('position') || '位置'}</Text>
              <Slider
                value={selected.position}
                minimumValue={0}
                maximumValue={1}
                step={0.01}
                onValueChange={updateSelectedPosition}
                style={styles.slider}
                minimumTrackTintColor={theme['c-button-background-active']}
                maximumTrackTintColor={theme['c-button-background']}
                thumbTintColor={theme['c-primary-light-100']}
              />
              <Text size={12} color={theme['c-primary-font']} style={styles.sliderValue}>{Math.round(selected.position * 100)}%</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button style={{ ...styles.footerBtn, backgroundColor: theme['c-button-background'] }} onPress={() => dialogRef.current?.setVisible(false)}>
            <Text size={14} color={theme['c-button-font']}>{t('cancel') || '取消'}</Text>
          </Button>
          <Button style={{ ...styles.footerBtn, backgroundColor: theme['c-button-background'] }} onPress={handleSave}>
            <Text size={14} color={theme['c-button-font']}>{t('confirm') || '保存'}</Text>
          </Button>
        </View>
      </View>
    </Dialog>
  )
})

const styles = createStyle({
  container: {
    padding: 15,
    minWidth: 320,
  },
  previewBox: {
    height: 36,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#333',
    marginBottom: 12,
  },
  scroll: {
    maxHeight: 360,
  },
  stopList: {
    marginBottom: 8,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 4,
  },
  stopColor: {
    width: 22,
    height: 22,
    borderRadius: 4,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  stopInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deleteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  addBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 12,
  },
  editor: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.2)',
  },
  editorTitle: {
    marginBottom: 8,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  sliderLabel: {
    width: 22,
  },
  slider: {
    flex: 1,
    height: 34,
  },
  sliderValue: {
    width: 42,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  footerBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 4,
    marginLeft: 10,
  },
})
