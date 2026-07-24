import { memo, useState, useEffect, useCallback } from 'react'
import { View, TouchableOpacity } from 'react-native'
import Section from '../../components/Section'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import { toast } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'

let carKeyPlugin: any = null
try {
  carKeyPlugin = require('@/plugins/carkey').default
} catch {}

export default memo(() => {
  const t = useI18n()
  const theme = useTheme()
  const [a11yRunning, setA11yRunning] = useState(false)
  const [listening, setListening] = useState(false)

  const checkStatus = useCallback(async () => {
    if (!carKeyPlugin?.isAvailable) return
    try {
      const isRunning = await carKeyPlugin.isAccessibilityServiceRunning()
      setA11yRunning(isRunning)
    } catch {}
  }, [])

  useEffect(() => {
    checkStatus()
    const timer = setInterval(checkStatus, 5000)
    return () => clearInterval(timer)
  }, [checkStatus])

  const handleOpenSettings = async () => {
    if (!carKeyPlugin?.isAvailable) {
      toast('CarKey模块不可用')
      return
    }
    try {
      await carKeyPlugin.openAccessibilitySettings()
      toast('已跳转到无障碍设置')
    } catch {
      toast('跳转失败')
    }
  }

  const handleStartListening = async () => {
    if (!carKeyPlugin?.isAvailable) {
      toast('CarKey模块不可用')
      return
    }
    try {
      toast('正在连接方控...')
      const result = await carKeyPlugin.startCarKeyListening()
      if (result) {
        setListening(true)
        toast('方控监听已启动')
      } else {
        toast('方控启动失败')
      }
    } catch (e: any) {
      toast('方控错误: ' + (e?.message || String(e)))
    }
  }

  const handleStopListening = async () => {
    if (!carKeyPlugin?.isAvailable) return
    try {
      await carKeyPlugin.stopCarKeyListening()
      setListening(false)
      toast('方控监听已停止')
    } catch {}
  }

  return (
    <Section title="方向盘控制">
      <View style={[styles.statusBar, { backgroundColor: a11yRunning ? '#1b8a3d20' : '#e6510020' }]}>
        <View style={[styles.indicator, { backgroundColor: a11yRunning ? '#1b8a3d' : '#e65100' }]} />
        <Text size={14} color={theme['c-font']}>
          无障碍服务: {a11yRunning ? '已开启' : '未开启'}
        </Text>
      </View>

      <View style={[styles.statusBar, { backgroundColor: listening ? '#1b8a3d20' : '#66666620' }]}>
        <View style={[styles.indicator, { backgroundColor: listening ? '#1b8a3d' : '#999' }]} />
        <Text size={14} color={theme['c-font']}>
          按键监听: {listening ? '运行中' : '未启动'}
        </Text>
      </View>

      {!a11yRunning && (
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: theme['c-primary'] || '#07c556' }]}
          onPress={handleOpenSettings}
          activeOpacity={0.7}
        >
          <Text size={14} color="#fff">前往系统设置开启无障碍</Text>
        </TouchableOpacity>
      )}

      {!listening ? (
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: theme['c-primary'] || '#07c556' }]}
          onPress={handleStartListening}
          activeOpacity={0.7}
        >
          <Text size={14} color="#fff">启动按键监听</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: theme['c-button-background'] }]}
          onPress={handleStopListening}
          activeOpacity={0.7}
        >
          <Text size={14} color={theme['c-button-font']}>停止按键监听</Text>
        </TouchableOpacity>
      )}

      <View style={styles.info}>
        <Text size={12} color={theme['c-font-label']}>
          方控通过吉利OneOS API直接连接系统服务,需platform签名。如果OneOS不可用,将回退到无障碍服务+MEDIA_BUTTON广播。
        </Text>
      </View>
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
