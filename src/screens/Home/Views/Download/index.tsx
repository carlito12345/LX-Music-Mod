import { memo, useEffect, useState } from 'react'
import { View, FlatList, TouchableOpacity, Share } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { subscribeDownloads, getDownloadList, clearCompleted, type DownloadTask } from '@/core/download'
import RNFS from 'react-native-fs'
import { toast } from '@/utils/tools'

const DownloadItem = memo(({ task, theme }: { task: DownloadTask; theme: any }) => {
  const statusText = {
    waiting: '等待中',
    downloading: `下载中 ${Math.round(task.progress * 100)}%`,
    completed: '已完成',
    failed: `失败: ${task.error || '未知错误'}`,
  }

  const handleShare = async () => {
    if (task.status !== 'completed' || !task.url) {
      toast('文件未下载完成')
      return
    }
    const safeName = (task.musicInfo.name || 'unknown').replace(/[\\/:*?"<>|]/g, '_')
    const safeSinger = (task.musicInfo.singer || 'unknown').replace(/[\\/:*?"<>|]/g, '_')
    const fileName = `${safeName} - ${safeSinger}.mp3`
    const filePath = `${RNFS.DocumentDirectoryPath}/lxmusic_downloads/${fileName}`
    
    try {
      await Share.share({
        url: `file://${filePath}`,
        title: fileName,
      })
    } catch (err: any) {
      toast(`分享失败: ${err.message}`)
    }
  }

  return (
    <TouchableOpacity style={styles.item} onPress={handleShare} activeOpacity={0.7}>
      <View style={styles.itemContent}>
        <Text size={14} color={theme['c-primary-font']} numberOfLines={1}>
          {task.musicInfo.name}
        </Text>
        <Text size={12} color={theme['c-font-label']} numberOfLines={1}>
          {task.musicInfo.singer}
        </Text>
      </View>
      <View style={styles.itemStatus}>
        <Text size={12} color={
          task.status === 'completed' ? theme['c-primary'] :
          task.status === 'failed' ? '#ff6b6b' :
          theme['c-font-label']
        }>
          {statusText[task.status]}
        </Text>
        {task.status === 'downloading' && (
          <View style={[styles.progressBar, { width: 60 }]}>
            <View style={[styles.progressFill, { 
              width: `${task.progress * 100}%`,
              backgroundColor: theme['c-primary']
            }]} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
})

export default memo(() => {
  const theme = useTheme()
  const [tasks, setTasks] = useState<DownloadTask[]>([])

  useEffect(() => {
    setTasks(getDownloadList())
    const unsubscribe = subscribeDownloads(setTasks)
    return unsubscribe
  }, [])

  const handleClearCompleted = () => {
    clearCompleted()
    toast('已清除完成的任务')
  }

  const downloadPath = `${RNFS.DocumentDirectoryPath}/lxmusic_downloads`

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text size={16} color={theme['c-primary-font']}>下载管理</Text>
        <TouchableOpacity onPress={handleClearCompleted} style={styles.clearBtn}>
          <Text size={12} color={theme['c-primary']}>清除已完成</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.pathInfo}>
        <Text size={11} color={theme['c-font-label']}>
          下载目录: {downloadPath}
        </Text>
      </View>

      {tasks.length === 0 ? (
        <View style={styles.empty}>
          <Text size={14} color={theme['c-font-label']}>暂无下载任务</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <DownloadItem task={item} theme={theme} />}
          style={styles.list}
        />
      )}
    </View>
  )
})

const styles = createStyle({
  container: {
    flex: 1,
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  clearBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  pathInfo: {
    marginBottom: 15,
    padding: 8,
    backgroundColor: 'rgba(128,128,128,0.1)',
    borderRadius: 6,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(128,128,128,0.08)',
    borderRadius: 8,
  },
  itemContent: {
    flex: 1,
    marginRight: 10,
  },
  itemStatus: {
    alignItems: 'flex-end',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(128,128,128,0.3)',
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
})
