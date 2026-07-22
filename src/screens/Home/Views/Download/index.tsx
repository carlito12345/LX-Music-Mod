import { memo, useEffect, useState } from 'react'
import { View, FlatList, TouchableOpacity, Share } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { subscribeDownloads, getDownloadList, clearCompleted, type DownloadTask } from '@/core/download'
import { useSettingValue } from '@/store/setting/hook'
import { setTempList } from '@/core/list'
import { playList } from '@/core/player/player'
import { LIST_IDS } from '@/config/constant'
import { updateSetting } from '@/core/common'
import RNFS from 'react-native-fs'
import { toast } from '@/utils/tools'

const handlePlayLocalFile = async (filePath: string) => {
  try {
    const name = filePath.split('/').pop()?.replace(/\.[^/.]+$/, '') || '本地文件'
    const ext = filePath.includes('.') ? filePath.split('.').pop() || '' : ''
    const musicInfo = {
      id: filePath,
      name,
      singer: '本地文件',
      source: 'local' as const,
      quality: 'unknown',
      interval: null,
      meta: { filePath, ext },
    }
    await setTempList('from_download', [musicInfo as any])
    await playList(LIST_IDS.TEMP, 0)
  } catch (err: any) {
    toast(`播放失败: ${err.message}`)
  }
}

const DownloadItem = memo(({ task, theme }: { task: DownloadTask; theme: any }) => {
  const statusText = {
    waiting: '等待中',
    downloading: `下载中 ${Math.round(task.progress * 100)}%`,
    completed: '已完成',
    failed: `失败: ${task.error || '未知错误'}`,
  }

  const handleClick = () => {
    if (task.status === 'completed' && task.filePath) {
      void handlePlayLocalFile(task.filePath)
    } else {
      toast('文件未下载完成')
    }
  }

  const handleLongPress = async () => {
    if (task.status !== 'completed' || !task.filePath) {
      toast('文件未下载完成')
      return
    }
    try {
      await Share.share({
        url: 'file://' + task.filePath,
        title: task.musicInfo.name || 'unknown',
      })
    } catch (err: any) {
      toast(`分享失败: ${err.message}`)
    }
  }

  return (
    <TouchableOpacity style={styles.item} onPress={handleClick} onLongPress={handleLongPress} activeOpacity={0.7}>
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

  const handleShowAddDownload = () => {
    toast('请在歌单或歌曲菜单中使用"下载"功能', 'long')
  }

  const handleClearCompleted = () => {
    clearCompleted()
    toast('已清除完成的任务')
  }

  // 读取设置
  const conflictActionSetting = useSettingValue('download.conflictAction')
  const conflictAction = conflictActionSetting || 'overwrite'

  const handleChangeDownloadDir = () => {
    toast('下载目录可在 设置 → 下载设置 中修改')
  }

  const handleToggleConflictAction = () => {
    const newAction = conflictAction === 'overwrite' ? 'skip' : 'overwrite'
    updateSetting({ 'download.conflictAction': newAction } as any)
    toast(newAction === 'overwrite' ? '已切换为覆盖模式' : '已切换为跳过模式')
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text size={16} color={theme['c-primary-font']}>下载管理</Text>
        <View style={styles.headerBtns}>
          <TouchableOpacity onPress={handleShowAddDownload} style={styles.addBtn}>
            <Text size={12} color={theme['c-primary']}>+ 添加下载</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClearCompleted} style={styles.clearBtn}>
            <Text size={12} color={theme['c-primary']}>清除已完成</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.settings}>
        <View style={styles.settingRow}>
          <Text size={12} color={theme['c-font-label']}>下载目录</Text>
          <TouchableOpacity onPress={handleChangeDownloadDir} style={styles.settingValue}>
            <Text size={11} color={theme['c-primary']} numberOfLines={1}>{`${RNFS.ExternalStorageDirectoryPath}/Music/LXMusic`}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.settingRow}>
          <Text size={12} color={theme['c-font-label']}>文件冲突</Text>
          <TouchableOpacity onPress={handleToggleConflictAction} style={styles.settingValue}>
            <Text size={11} color={theme['c-primary']}>{conflictAction === 'overwrite' ? '覆盖旧文件' : '跳过'}</Text>
          </TouchableOpacity>
        </View>
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
  settings: {
    padding: 10,
    backgroundColor: 'rgba(128,128,128,0.06)',
    borderRadius: 8,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  settingValue: {
    maxWidth: '60%',
    padding: 4,
  },
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
  headerBtns: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 8,
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
