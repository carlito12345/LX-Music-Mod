import { memo, useState, useEffect, useCallback } from 'react'
import { View, TouchableOpacity } from 'react-native'
import Section from '../../components/Section'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'

let carKeyPlugin: any = null
try {
  carKeyPlugin = require('@/plugins/carkey').default
} catch {}

export default memo(() => {
  const t = useI18n()
  const theme = useTheme()
  const [running, setRunning] = useState(false)

  const checkStatus = useCallback(async () => {
    if (!carKeyPlugin?.isAvailable) return
    try {
      const isRunning = await carKeyPlugin.isAccessibilityServiceRunning()
      setRunning(isRunning)
    } catch {}
  }, [])

  useEffect(() => {
    checkStatus()
    const timer = setInterval(checkStatus, 3000)
    return () => clearInterval(timer)
  }, [checkStatus])

  const handleOpenSettings = async () => {
    if (!carKeyPlugin?.isAvailable) return
    await carKeyPlugin.openAccessibilitySettings()
  }

  const handleStartListening = async () => {
    if (!carKeyPlugin?.isAvailable) return
    await carKeyPlugin.startCarKeyListening()
  }

  return (
    <Section title="方向盘控制">
      <View style={[styles.statusBar, { backgroundColor: running ? '#1b8a3d20' : '#e6510020' }]}>
        <View style={[styles.indicator, { backgroundColor: running ? '#1b8a3d' : '#e65100' }]} />
        <Text size={14} color={theme['c-font']}>
          无障碍服务: {running ? '已开启' : '未开启'}
        </Text>
      </View>

      {!running && (
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: theme['c-primary'] || '#07c556' }]}
          onPress={handleOpenSettings}
          activeOpacity={0.7}
        >
          <Text size={14} color="#fff">前往系统设置开启无障碍</Text>
        </TouchableOpacity>
      )}

      <View style={styles.info}>
        <Text size={12} color={theme['c-font-label']}>
          方向盘控制通过无障碍服务捕获按键,需在系统设置→无障碍→LX Music中手动开启。
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.btn, { backgroundColor: theme['c-button-background'] }]}
        onPress={handleStartListening}
        activeOpacity={0.7}
      >
        <Text size={14} color={theme['c-button-font']}>启动按键监听</Text>
      </TouchableOpacity>
    </Section>
  )
})

const styles = createStyle({
  statusBar: {
    flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 10,
  },
  indicator: {
    width: 10, height: 10, borderRadius: 5, marginRight: 8,
  },
  btn: {
    padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 8,
  },
  info: {
    padding: 10, borderRadius: 6, marginBottom: 8,
  },
})
