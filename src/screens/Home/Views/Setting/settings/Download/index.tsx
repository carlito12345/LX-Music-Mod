import { memo, useEffect, useState } from 'react'
import { View, TouchableOpacity, Share, FlatList } from 'react-native'
import Section from '../../components/Section'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { downloadManager } from '@/core/download'
import { useDownloadTasks, useDownloadHistory } from '@/store/download/hook'
import { downloadEvent } from '@/event/downloadEvent'
import RNFS from 'react-native-fs'
import { toast } from '@/utils/tools'
import { useI18n } from '@/lang'

const DownloadItem = ({ task, theme }: { task: LX.Download.ListItem; theme: any }) => {
  const t = useI18n()

  const statusText: Record<string, string> = {
    run: `${t('download_status_downloading')} ${Math.round(task.progress * 100)}%`,
    waiting: t('download_status_waiting'),
    completed: t('download_status_completed'),
    error: t('download_status_failed'),
    pause: '暂停',
  }

  const handleDelete = () => {
    void downloadManager.deleteTask(task.id)
  }

  return (
    <View style={[styles.item, { backgroundColor: 'rgba(128,128,128,0.06)' }]}>
      <View style={styles.itemContent}>
        <Text size={13} color={theme['c-font']} numberOfLines={1}>{task.metadata.musicInfo.name}</Text>
        <Text size={11} color={theme['c-font-label']} numberOfLines={1}>{task.metadata.musicInfo.singer}</Text>
      </View>
      <View style={styles.itemStatus}>
        <Text size={11} color={
          task.status === 'completed' ? theme['c-primary'] :
          task.status === 'error' ? '#ff6b6b' : theme['c-font-label']
        }>{statusText[task.status] || task.status}</Text>
        {task.speed && <Text size={10} color={theme['c-font-label']}>{task.speed}</Text>}
        {task.status === 'run' && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${task.progress * 100}%`, backgroundColor: theme['c-primary'] }]} />
          </View>
        )}
      </View>
      <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
        <Text size={11} color="#ff6b6b">×</Text>
      </TouchableOpacity>
    </View>
  )
}

export default memo(() => {
  const t = useI18n()
  const theme = useTheme()
  const tasks = useDownloadTasks()

  const handleClearCompleted = () => {
    const completedTasks = tasks.filter(t => t.status === 'completed')
    completedTasks.forEach(task => {
      void downloadManager.deleteTask(task.id)
    })
    toast('已清除已完成')
  }

  const downloadPath = `${RNFS.ExternalStorageDirectoryPath}/Music/LXMusic`
  const downloadingCount = downloadManager.getDownloadingCount()

  return (
    <Section title={t('setting_download') || '下载'}>
      <View style={[styles.pathInfo, { backgroundColor: 'rgba(128,128,128,0.08)' }]}>
        <Text size={11} color={theme['c-font-label']}>下载目录: {downloadPath}</Text>
        {downloadingCount > 0 && <Text size={11} color={theme['c-primary']}>正在下载: {downloadingCount} 个</Text>}
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
  pathInfo: { marginBottom: 8, padding: 8, borderRadius: 6 },
  clearBtn: { alignSelf: 'flex-end', paddingVertical: 4, paddingHorizontal: 8, marginBottom: 8 },
  empty: { paddingVertical: 20, alignItems: 'center' },
  item: { flexDirection: 'row', alignItems: 'center', padding: 10, marginBottom: 6, borderRadius: 6 },
  itemContent: { flex: 1, marginRight: 8 },
  itemStatus: { alignItems: 'flex-end', marginRight: 8 },
  progressBar: { width: 50, height: 3, backgroundColor: 'rgba(128,128,128,0.2)', borderRadius: 2, marginTop: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  deleteBtn: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
})
