/**
 * Debug - 调试面板
 * 日志级别控制、日志查看、导出、清除
 */
import { memo, useRef, useState, useEffect } from 'react'
import { View, ScrollView, TextInput } from 'react-native'
import { createStyle, toast } from '@/utils/tools'
import AppCardSection from '../components/AppCardSection'
import Button from '../components/Button'
import CheckBoxItem from '../components/CheckBoxItem'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import ConfirmAlert, { type ConfirmAlertType } from '@/components/common/ConfirmAlert'
import logger, { getLogContent, clearLogs, setEnabled, setLevel, type LogLevel } from '@/plugins/logger'
import { NativeModules } from 'react-native'

const LEVELS: { key: LogLevel; label: string }[] = [
  { key: 'DEBUG', label: '详细(DEBUG)' },
  { key: 'INFO', label: '普通(INFO)' },
  { key: 'WARN', label: '仅警告(WARN)' },
  { key: 'ERROR', label: '仅错误(ERROR)' },
]

export default memo(() => {
  const t = useI18n()
  const alertRef = useRef<ConfirmAlertType>(null)
  const [logEnabled, setLogEnabled] = useState(false)
  const [logLevel, setLogLevel] = useState<LogLevel>('DEBUG')
  const [logText, setLogText] = useState('')
  const [searchText, setSearchText] = useState('')
  const isUnmountedRef = useRef(true)

  const refreshLog = async () => {
    const content = await getLogContent(2)
    if (isUnmountedRef.current) return
    if (searchText) {
      const lines = content.split('\n')
      const filtered = lines.filter(l => l.includes(searchText))
      setLogText(filtered.join('\n'))
    } else {
      setLogText(content)
    }
  }

  const handleToggleLog = async (v: boolean) => {
    setLogEnabled(v)
    setEnabled(v)
    try {
      const { setFileLoggerEnabled } = require('@/utils/log')
      setFileLoggerEnabled(v)
    } catch {}
    // 原生日志路径确认
    try {
      if (NativeModules.NativeLogger) {
        const path = await NativeModules.NativeLogger.getLogPath()
        console.log('[Debug] NativeLogger path:', path)
      } else {
        console.warn('[Debug] NativeLogger module not found')
      }
    } catch (e) {
      console.warn('[Debug] NativeLogger path error:', String(e))
    }
    if (v) {
      const ok = await logger.test()
      toast(ok ? '日志记录已开启 (Download/LXMusic_Logs/)' : '日志启动失败')
    } else {
      toast('日志记录已关闭')
    }
  }

  const handleSetLevel = (level: LogLevel) => {
    setLogLevel(level)
    setLevel(level)
    toast('日志级别已切换')
  }

  const handleViewLog = () => {
    refreshLog()
    alertRef.current?.setVisible(true)
  }

  const handleCleanLog = async () => {
    await clearLogs()
    toast('日志已清除')
    refreshLog()
  }

  const handleExportLog = async () => {
    try {
      const RNFS = require('react-native-fs')
      const content = await getLogContent(7)
      const exportPath = RNFS.DownloadDirectoryPath + '/LXMusic_Debug_Log.txt'
      await RNFS.writeFile(exportPath, content, 'utf8')
      toast('已导出到 Download/LXMusic_Debug_Log.txt')
    } catch {
      toast('导出失败')
    }
  }

  useEffect(() => {
    isUnmountedRef.current = false
    return () => { isUnmountedRef.current = true }
  }, [])

  return (
    <ScrollView>
      <AppCardSection title="日志记录">
        <View style={styles.row}>
          <CheckBoxItem check={logEnabled} label="开启日志记录" onChange={handleToggleLog} />
        </View>
        <Text style={styles.hint}>开启后日志将保存到 Download/LXMusic_Logs/ 目录</Text>
      </AppCardSection>

      <AppCardSection title="日志级别">
        <View style={styles.levelRow}>
          {LEVELS.map(l => (
            <Button key={l.key} onPress={() => handleSetLevel(l.key)} style={logLevel === l.key ? styles.activeBtn : undefined}>
              <Text color={logLevel === l.key ? '#fff' : undefined}>{l.label}</Text>
            </Button>
          ))}
        </View>
      </AppCardSection>

      <AppCardSection title="日志操作">
        <View style={styles.row}>
          <Button onPress={handleViewLog}>查看日志</Button>
          <Button onPress={handleExportLog}>导出日志</Button>
          <Button onPress={handleCleanLog}>清除日志</Button>
        </View>
      </AppCardSection>

      <AppCardSection title="过滤">
        <TextInput
          style={styles.input}
          placeholder="输入关键字过滤..."
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={refreshLog}
        />
      </AppCardSection>

      <ConfirmAlert
        ref={alertRef}
        cancelText="关闭"
        confirmText="清除"
        onConfirm={handleCleanLog}
        showConfirm={!!logText}
        reverseBtn={true}
      >
        <ScrollView style={styles.logContainer}>
          {logText
            ? <Text selectable size={11}>{ logText }</Text>
            : <Text size={13}>暂无日志</Text>
          }
        </ScrollView>
      </ConfirmAlert>
    </ScrollView>
  )
})

const styles = createStyle({
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 8,
  },
  levelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingBottom: 8,
  },
  activeBtn: {
    backgroundColor: '#5B6ABF',
  },
  hint: {
    fontSize: 12,
    opacity: 0.6,
    paddingBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    color: '#333',
  },
  logContainer: {
    maxHeight: 400,
  },
})
