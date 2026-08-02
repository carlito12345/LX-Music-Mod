/**
 * Log - 日志记录页面(独立)
 * 大屏查看日志 + 复制 + 清空 + 日志开关
 */
import { memo, useState, useCallback, useRef, useEffect } from 'react'
import { View, ScrollView, TouchableOpacity, RefreshControl, Share, Platform } from 'react-native'
import { createStyle, toast } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useStatusbarHeight } from '@/store/common/hook'
import { getLogs, clearLogs } from '@/utils/log'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import CheckBoxItem from '../Setting/components/CheckBoxItem'

export default memo(() => {
  const theme = useTheme()
  const statusBarHeight = useStatusbarHeight()
  const [logText, setLogText] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const scrollRef = useRef<ScrollView>(null)

  const [isEnableSyncLog, setIsEnableSyncLog] = useState(global.lx.isEnableSyncLog)
  const [isEnableUserApiLog, setIsEnableUserApiLog] = useState(global.lx.isEnableUserApiLog)

  const loadLogs = useCallback(async () => {
    try {
      const log = await getLogs()
      const logArr = log.split(/^----lx log----\n|\n----lx log----\n|\n----lx log----$/)
      logArr.reverse()
      setLogText(logArr.join('\n\n').replace(/^\n+|\n+$/, '') || '暂无日志记录')
    } catch {
      setLogText('读取日志失败')
    }
  }, [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadLogs()
    setRefreshing(false)
  }, [loadLogs])

  useEffect(() => { void loadLogs() }, [loadLogs])

  const handleCopy = () => {
    void Share.share({ message: logText }).catch(() => {})
  }

  const handleClear = () => {
    void clearLogs().then(() => {
      toast('日志已清空')
      void loadLogs()
    })
  }

  return (
    <View style={[styles.container, { paddingTop: statusBarHeight }]}>
      <View style={styles.header}>
        <Text size={20} color={theme['c-font']} style={styles.title}>日志记录</Text>
        <Text size={12} color={theme['c-font-label']}>查看应用运行日志与错误信息</Text>
      </View>

      <View style={styles.toolbar}>
        <TouchableOpacity style={[styles.toolBtn, { backgroundColor: theme['c-primary'] }]} onPress={() => void onRefresh()}>
          <Icon name="refresh" color="#fff" size={16} />
          <Text size={13} color="#fff">刷新</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toolBtn, { backgroundColor: theme['c-primary'] }]} onPress={handleCopy}>
          <Icon name="share" color="#fff" size={16} />
          <Text size={13} color="#fff">分享</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toolBtn, { backgroundColor: '#F44336' }]} onPress={handleClear}>
          <Icon name="delete" color="#fff" size={16} />
          <Text size={13} color="#fff">清空</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.switches}>
        <CheckBoxItem
          check={isEnableSyncLog}
          label="记录同步错误日志"
          onChange={(v) => { setIsEnableSyncLog(v); global.lx.isEnableSyncLog = v }}
        />
        <CheckBoxItem
          check={isEnableUserApiLog}
          label="记录音源请求日志"
          onChange={(v) => { setIsEnableUserApiLog(v); global.lx.isEnableUserApiLog = v }}
        />
      </View>

      <ScrollView
        ref={scrollRef}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        style={styles.logArea}
        contentContainerStyle={{ padding: 12 }}
      >
        <Text size={12} color={theme['c-font-label']} style={styles.logText} selectable>
          {logText}
        </Text>
      </ScrollView>
    </View>
  )
})

const styles = createStyle({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontWeight: '600' },
  toolbar: { flexDirection: 'row', paddingHorizontal: 15, gap: 10, marginBottom: 10 },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  switches: { paddingHorizontal: 15, marginBottom: 10, gap: 6 },
  logArea: { flex: 1, marginHorizontal: 15, marginBottom: 15, borderRadius: 12, backgroundColor: '#00000033', overflow: 'hidden' },
  logText: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', lineHeight: 18 },
})
