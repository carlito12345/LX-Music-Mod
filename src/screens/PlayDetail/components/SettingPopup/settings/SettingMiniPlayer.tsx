import { useState, useCallback } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import CheckBox from '@/components/common/CheckBox'
import Slider from '@/components/common/Slider'
import { useSettingValue } from '@/store/setting/hook'
import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { useAsyncEventListener } from '@/utils/hooks'
import { createStyle } from '@/utils/tools'
import styles from './style'

const PRESET_COLORS = [
  // 经典色
  { name: '纯白', color: '#ffffff' },
  { name: '翠绿', color: '#07c556' },
  { name: '极光绿', color: '#00e676' },
  { name: '霓虹绿', color: '#39ff14' },
  // 红粉系
  { name: '烈焰红', color: '#ff1744' },
  { name: '玫瑰红', color: '#ff4081' },
  { name: '樱花粉', color: '#f48fb1' },
  { name: '珊瑚橙', color: '#ff6d00' },
  // 蓝紫系
  { name: '天空蓝', color: '#00b0ff' },
  { name: '电光蓝', color: '#2979ff' },
  { name: '深海蓝', color: '#1a237e' },
  { name: '魅惑紫', color: '#d500f9' },
  { name: '星空紫', color: '#7c4dff' },
  { name: '霓虹紫', color: '#ea80fc' },
  // 暖色系
  { name: '琥珀金', color: '#ffab00' },
  { name: '日落橙', color: '#e65100' },
  { name: '柠檬黄', color: '#ffea00' },
  // 冷色系
  { name: '薄荷绿', color: '#1de9b6' },
  { name: '青色', color: '#00bcd4' },
  { name: '冰雪蓝', color: '#80d8ff' },
]

const MiniPlayerSetting = () => {
  const theme = useTheme()
  const t = useI18n()
  const [expanded, setExpanded] = useState(false)

  const followBg = useSettingValue('miniPlayer.followBgColor')
  const lyricLines = useSettingValue('miniPlayer.lyricLines')
  const highlightColor = useSettingValue('miniPlayer.lyricHighlightColor')
  const cw = useSettingValue('miniPlayer.customWidth')
  const ch = useSettingValue('miniPlayer.customHeight')

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ marginRight: 8 }}>▶</Text>
        <Text>迷你播放器设置</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={s.subContainer}>
          {/* 跟随背景色 */}
          <View style={s.row}>
            <Text size={13}>跟随播放器纯色背景</Text>
            <CheckBox check={!!followBg} onChange={v => updateSetting({ 'miniPlayer.followBgColor': v })} />
          </View>

          {/* 尺寸 */}
          <View style={s.row}>
            <Text size={13}>宽度: {cw}dp</Text>
            <Slider
              minimumValue={300} maximumValue={900} step={10}
              value={cw}
              onSlidingComplete={v => updateSetting({ 'miniPlayer.customWidth': Math.trunc(v) })}
              style={{ flex: 1, marginLeft: 8 }}
            />
          </View>
          <View style={s.row}>
            <Text size={13}>高度: {ch}dp</Text>
            <Slider
              minimumValue={500} maximumValue={1400} step={10}
              value={ch}
              onSlidingComplete={v => updateSetting({ 'miniPlayer.customHeight': Math.trunc(v) })}
              style={{ flex: 1, marginLeft: 8 }}
            />
          </View>

          {/* 歌词行数 */}
          <View style={s.row}>
            <Text size={13}>歌词行数: {lyricLines}</Text>
            <Slider
              minimumValue={1} maximumValue={5} step={1}
              value={lyricLines}
              onSlidingComplete={v => updateSetting({ 'miniPlayer.lyricLines': Math.trunc(v) })}
              style={{ flex: 1, marginLeft: 8 }}
            />
          </View>

          {/* 歌词高亮色 */}
          <Text size={13} style={{ marginTop: 8 }}>歌词高亮颜色</Text>
          <View style={s.colorRow}>
            {PRESET_COLORS.map(c => (
              <TouchableOpacity
                key={c.color}
                onPress={() => updateSetting({ 'miniPlayer.lyricHighlightColor': c.color })}
                style={[s.colorBtn, { backgroundColor: c.color, borderColor: highlightColor === c.color ? '#fff' : 'transparent' }]}
              >
                <Text size={9} color={c.color === '#ffffff' ? '#000' : '#fff'}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  )
}

const s = createStyle({
  subContainer: {
    width: '100%',
    paddingLeft: 8,
    paddingTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    gap: 6,
  },
  colorBtn: {
    width: 44,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default MiniPlayerSetting
