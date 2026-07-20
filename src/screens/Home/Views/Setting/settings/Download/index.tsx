import { memo, useEffect, useState } from 'react'
import { View, TouchableOpacity, Share } from 'react-native'
import Section from '../../components/Section'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { subscribeDownloads, getDownloadList, clearCompleted } from '@/core/download'
import type { DownloadTask } from '@/core/download'
import RNFS from 'react-native-fs'
import { toast } from '@/utils/tools'
import { useI18n } from '@/lang'

const DownloadItem = ({ task, theme }: { task: DownloadTask; theme: any }) => {
  const statusText: Record<string, string> = {
    waiting: '等待中',
    downloading: `下载中 ${Math.round(task.progress * 100)}%`,
    completed: '已完成',
    failed: '失败',
  }

  const handlePress = async () => {
    if (task.status !== 'completed') return
    const filePath = task.filePath
    if (!filePath) {
      toast('文件路径不存在')
      return
    }
    try {
      const exists = await RNFS.exists(filePath)
      if (!exists) { toast('文件不存在'); return }
      const fileName = filePath.split('/').pop() || 'unknown'
      await Share.share({ url: `file://${filePath}`, title: fileName })
    } catch (err: any) { toast(`分享失败: ${err.message}`) }
  }

  return (
    <TouchableOpacity style={styles.item} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.itemContent}>
        <Text size={13} color={theme['c-font']} numberOfLines={1}>{task.musicInfo.name}</Text>
        <Text size={11} color={theme['c-font-label']} numberOfLines={1}>{task.musicInfo.singer}</Text>
      </View>
      <View style={styles.itemStatus}>
        <Text size={11} color={
          task.status === 'completed' ? theme['c-primary'] :
          task.status === 'failed' ? '#ff6b6b' : theme['c-font-label']
        }>{statusText[task.status]}</Text>
        {task.status === 'downloading' && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${task.progress * 100}%`, backgroundColor: theme['c-primary'] }]} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}

export default memo(() => {
  const t = useI18n()
  const theme = useTheme()
  const [tasks, setTasks] = useState<DownloadTask[]>([])

  useEffect(() => {
    setTasks(getDownloadList())
    const unsubscribe = subscribeDownloads((newTasks) => {
      // 创建新数组引用以触发重渲染
      setTasks([...newTasks])
    })
    return unsubscribe
  }, [])

  const handleClearCompleted = () => { clearCompleted(); toast('已清除') }
  const downloadPath = `${RNFS.ExternalStorageDirectoryPath}/Music/LXMusic`

  return (
    <Section title={t('setting_download') || '下载'}>
      <View style={styles.pathInfo}>
        <Text size={11} color={theme['c-font-label']}>下载目录: {downloadPath}</Text>
      </View>
      {tasks.length > 0 && (
        <TouchableOpacity onPress={handleClearCompleted} style={styles.clearBtn}>
          <Text size={12} color={theme['c-primary']}>清除已完成</Text>
        </TouchableOpacity>
      )}
      {tasks.length === 0 ? (
        <View style={styles.empty}><Text size={12} color={theme['c-font-label']}>暂无下载任务</Text></View>
      ) : (
        tasks.map(task => <DownloadItem key={task.id} task={task} theme={theme} />)
      )}
    </Section>
  )
})

const styles = createStyle({
  pathInfo: { marginBottom: 8, padding: 8, backgroundColor: 'rgba(128,128,128,0.08)', borderRadius: 6 },
  clearBtn: { alignSelf: 'flex-end', paddingVertical: 4, paddingHorizontal: 8, marginBottom: 8 },
  empty: { paddingVertical: 20, alignItems: 'center' },
  item: { flexDirection: 'row', alignItems: 'center', padding: 10, marginBottom: 6, backgroundColor: 'rgba(128,128,128,0.06)', borderRadius: 6 },
  itemContent: { flex: 1, marginRight: 8 },
  itemStatus: { alignItems: 'flex-end' },
  progressBar: { width: 50, height: 3, backgroundColor: 'rgba(128,128,128,0.2)', borderRadius: 2, marginTop: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
})
