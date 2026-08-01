import { memo, useState, useEffect, useCallback } from 'react'
import { View, TouchableOpacity } from 'react-native'
import Section from '../../components/AppCardSection'
import Text from '@/components/common/Text'
import { createStyle, toast } from '@/utils/tools'
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
  const [geelyConnected, setGeelyConnected] = useState(false)
  const [diag, setDiag] = useState('')

  const checkStatus = useCallback(async () => {
    if (!carKeyPlugin?.isAvailable) return
    try {
      const isRunning = await carKeyPlugin.isAccessibilityServiceRunning()
      setA11yRunning(isRunning)
    } catch {}
    try {
      const connected = await carKeyPlugin.isGeelyConnected?.()
      setGeelyConnected(connected === true)
    } catch {}
  }, [])

  useEffect(() => {
    checkStatus()
    const timer = setInterval(checkStatus, 5000)
    return () => clearInterval(timer)
  }, [checkStatus])

  const handleStartListening = async () => {
    if (!carKeyPlugin) {
      toast('CarKey插件加载失败')
      return
    }
    if (!carKeyPlugin.isAvailable) {
      toast('CarKey原生模块未注册')
      return
    }
    try {
      toast('正在连接...')
      const result = await carKeyPlugin.startCarKeyListening()
      if (result) {
        setListening(true)
        toast('方控监听已启动')
      } else {
        toast('方控启动返回false')
      }
    } catch (e: any) {
      const msg = e?.message || String(e) || '未知错误'
      toast('错误: ' + msg.substring(0, 60))
    }
  }

  const handleStopListening = async () => {
    if (!carKeyPlugin?.isAvailable) return
    try {
      await carKeyPlugin.stopCarKeyListening()
      setListening(false)
      toast('已停止')
    } catch {}
  }

  const handleOpenSettings = async () => {
    if (!carKeyPlugin?.isAvailable) {
      toast('CarKey模块不可用')
      return
    }
    try {
      await carKeyPlugin.openAccessibilitySettings()
    } catch {
      toast('跳转失败')
    }
  }

  return (
    <Section title="方向盘控制">
      <View style={[styles.statusBar, { backgroundColor: a11yRunning ? '#1b8a3d20' : '#e6510020' }]}>
        <View style={[styles.indicator, { backgroundColor: a11yRunning ? '#1b8a3d' : '#e65100' }]} />
        <Text size={14} color={theme['c-font']}>无障碍: {a11yRunning ? '已开启' : '未开启'}</Text>
      </View>

      <View style={[styles.statusBar, { backgroundColor: listening ? '#1b8a3d20' : '#66666620' }]}>
        <View style={[styles.indicator, { backgroundColor: listening ? '#1b8a3d' : '#999' }]} />
        <Text size={14} color={theme['c-font']}>监听: {listening ? '运行中' : '未启动'}</Text>
      </View>

      <View style={[styles.statusBar, { backgroundColor: carKeyPlugin?.isAvailable ? '#1b8a3d20' : '#e6510020' }]}>
        <View style={[styles.indicator, { backgroundColor: carKeyPlugin?.isAvailable ? '#1b8a3d' : '#e65100' }]} />
        <Text size={14} color={theme['c-font']}>原生模块: {carKeyPlugin?.isAvailable ? '可用' : '不可用'}</Text>
      </View>

      {!a11yRunning && (
        <TouchableOpacity style={[styles.btn, { backgroundColor: theme['c-primary'] || '#07c556' }]} onPress={handleOpenSettings} activeOpacity={0.7}>
          <Text size={14} color="#fff">前往无障碍设置</Text>
        </TouchableOpacity>
      )}

      {!listening ? (
        <TouchableOpacity style={[styles.btn, { backgroundColor: theme['c-primary'] || '#07c556' }]} onPress={handleStartListening} activeOpacity={0.7}>
          <Text size={14} color="#fff">启动按键监听</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={[styles.btn, { backgroundColor: theme['c-button-background'] }]} onPress={handleStopListening} activeOpacity={0.7}>
          <Text size={14} color={theme['c-button-font']}>停止按键监听</Text>
        </TouchableOpacity>
      )}

      <View style={[styles.statusBar, { backgroundColor: geelyConnected ? '#1b8a3d20' : '#e6510020' }]}>
        <View style={[styles.indicator, { backgroundColor: geelyConnected ? '#1b8a3d' : '#e65100' }]} />
        <Text size={14} color={theme['c-font']}>OneOS API: {geelyConnected ? '已连接' : '未连接'}</Text>
      </View>

      {diag ? (
        <View style={[styles.statusBar, { backgroundColor: '#33333320' }]}>
          <Text size={11} color={theme['c-font-label']} numberOfLines={3}>{diag}</Text>
        </View>
      ) : null}

      <TouchableOpacity style={[styles.btn, { backgroundColor: theme['c-button-background'] }]} onPress={async () => {
        try {
          const d = await carKeyPlugin?.getGeelyDiagnostic?.()
          setDiag(d || 'no data')
        } catch {}
      }} activeOpacity={0.7}>
        <Text size={14} color={theme['c-button-font']}>诊断</Text>
      </TouchableOpacity>

      <View style={styles.info}>
        <Text size={12} color={theme['c-font-label']}>
          方控通过吉利OneOS API直连系统服务,需platform签名。启动后尝试连接OneOS,同时注册MEDIA_BUTTON广播作为后备。
        </Text>
      </View>
    </Section>
  )
})

const styles = createStyle({
  statusBar: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 8 },
  indicator: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  btn: { padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 8 },
  info: { padding: 10, borderRadius: 6, marginBottom: 8 },
})
