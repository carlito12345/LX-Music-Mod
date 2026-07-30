/**
 * SettingLayout - 播放器布局选择
 */
import { memo, useState, useEffect } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { createStyle, toast } from '@/utils/tools'
import Text from '@/components/common/Text'

const LAYOUTS = [
  { key: 'default', label: '经典' },
  { key: 'musicfree', label: 'MusicFree 风格' },
]

export default memo(() => {
  const [current, setCurrent] = useState('default')
  useEffect(() => {
    try { setCurrent(require('@/plugins/layoutManager').getLayout()) } catch {}
  }, [])

  return (
    <View style={styles.container}>
      <Text size={14} style={styles.title}>播放器布局</Text>
      <View style={styles.row}>
        {LAYOUTS.map(layout => (
          <TouchableOpacity
            key={layout.key}
            onPress={() => {
              try {
                require('@/plugins/layoutManager').setLayout(layout.key)
                setCurrent(layout.key)
                toast('切换到: ' + layout.label)
              } catch {}
            }}
            style={[styles.btn, { backgroundColor: current === layout.key ? '#5B6ABF' : 'rgba(128,128,128,0.15)' }]}
            activeOpacity={0.7}
          >
            <Text size={14} color={current === layout.key ? '#fff' : undefined}>{layout.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
})

const styles = createStyle({
  container: { paddingTop: 8, paddingBottom: 4 },
  title: { paddingBottom: 6 },
  row: { flexDirection: 'row', gap: 8 },
  btn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
})
