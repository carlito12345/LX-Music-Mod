import { memo, useCallback, useRef } from 'react'
import { View, TouchableOpacity, type GestureResponderEvent } from 'react-native'

import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { createStyle, confirmDialog, toast, shareMusic } from '@/utils/tools'
import Text from '@/components/common/Text'
import Menu, { type MenuType, type Position } from '@/components/common/Menu'
import { downloadManager } from '@/core/download'
import { playList } from '@/core/player/player'
import { LIST_IDS } from '@/config/constant'
import { setTempList } from '@/core/list'
import RNFS from 'react-native-fs'

export default memo(({ item }: {
  item: LX.Download.DownloadHistoryItem
}) => {
  const t = useI18n()
  const theme = useTheme()
  const menuRef = useRef<MenuType>(null)

  const handleDelete = async() => {
    const confirm = await confirmDialog({
      message: t('download_delete_confirm'),
      bgClose: false,
    })
    if (confirm) {
      await downloadManager.deleteTask(item.id)
    }
  }

  const handleRetry = async() => {
    await downloadManager.retryTask(item.id)
  }

  const handlePlay = useCallback(async () => {
    if (item.status !== 'completed' || !item.filePath) return
    try {
      const exists = await RNFS.exists(item.filePath)
      if (!exists) {
        toast(t('download_file_not_found'))
        return
      }
      // 当作本地文件播放,避免污染当前歌单
      const fileName = item.filePath.split('/').pop() || item.musicInfo.name
      const ext = fileName.includes('.') ? fileName.split('.').pop() || '' : ''
      const localMusicInfo = {
        id: item.filePath,
        name: item.musicInfo.name || fileName.replace(/\.[^/.]+$/, ''),
        singer: item.musicInfo.singer || '本地文件',
        source: 'local' as const,
        quality: item.quality || 'unknown',
        interval: null,
        meta: { filePath: item.filePath, ext },
      }
      await setTempList('download_play', [localMusicInfo])
      await playList(LIST_IDS.TEMP, 0)
    } catch (err: any) {
      toast(t('download_play_failed') + ': ' + err.message)
    }
  }, [item, t])

  const handleShowMenu = useCallback((event: GestureResponderEvent) => {
    const { pageX, pageY } = event.nativeEvent
    const x = Number(pageX) || 100
    const y = Number(pageY) || 200
    const position: Position = { w: 200, h: 60, x, y }
    menuRef.current?.show(position)
  }, [])

  const handleMenuPress = useCallback(async (menu: { action: string }) => {
    switch (menu.action) {
      case 'play':
        await handlePlay()
        break
      case 'share':
        if (item.musicInfo) {
          shareMusic(item.musicInfo)
        }
        break
      case 'deleteFile':
        if (item.filePath) {
          const confirmFile = await confirmDialog({
            message: t('download_delete_file_confirm'),
            bgClose: false,
          })
          if (confirmFile) {
            try {
              await RNFS.unlink(item.filePath)
              toast(t('download_file_deleted'))
              await downloadManager.deleteTask(item.id)
            } catch (err: any) {
              toast(t('download_delete_file_failed') + ': ' + err.message)
            }
          }
        }
        break
      case 'retry':
        await handleRetry()
        break
    }
  }, [item, t, handlePlay])

  const isFailed = item.status === 'failed'
  const isCompleted = item.status === 'completed'
  const formattedTime = item.completedTime ? new Date(item.completedTime).toLocaleDateString() : '-'
  const fileSize = item.fileSize ? `${(item.fileSize / 1024 / 1024).toFixed(1)} MB` : '-'

  const menus = []
  if (isCompleted && item.filePath) {
    menus.push({ action: 'play', label: t('play') })
    menus.push({ action: 'share', label: t('share') })
    menus.push({ action: 'deleteFile', label: t('download_delete_file') })
  }
  if (isFailed) {
    menus.push({ action: 'retry', label: t('download_retry') })
  }

  return (
    <>
      <TouchableOpacity 
        style={{ ...styles.container, borderBottomColor: theme['c-border-background'] }}
        onPress={handlePlay}
        activeOpacity={0.7}
        onLongPress={(e) => handleShowMenu(e)}
      >
        <View style={styles.info}>
          <Text numberOfLines={1} size={14} color={theme['c-font']}>{item.musicInfo.name}</Text>
          <Text numberOfLines={1} size={12} color={theme['c-font-label']}>{item.musicInfo.singer}</Text>
          <View style={styles.statusRow}>
            <Text size={12} color={isFailed ? theme['c-error-font'] : theme['c-success-font']}>
              {isFailed ? t('download_status_failed') : t('download_status_completed')}
            </Text>
            <Text size={12} color={theme['c-font-label']}>{fileSize}</Text>
            <Text size={12} color={theme['c-font-label']}>{formattedTime}</Text>
          </View>
          {
            isFailed && item.errorMessage
              ? <Text size={12} color={theme['c-error-font']} style={styles.errorTip}>{item.errorMessage}</Text>
              : null
          }
        </View>
        <View style={styles.action}>
          {
            isFailed
              ? <Text style={styles.actionBtn} onPress={handleRetry} color={theme['c-primary-font']}>{t('download_retry')}</Text>
              : null
          }
          <Text style={styles.actionBtn} onPress={handleDelete} color={theme['c-error-font']}>{t('download_delete')}</Text>
        </View>
      </TouchableOpacity>
      <Menu 
        ref={menuRef} 
        menus={menus} 
        onPress={handleMenuPress} 
      />
    </>
  )
})

const styles = createStyle({
  container: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginRight: 10,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  errorTip: {
    marginTop: 4,
  },
  action: {
    flexShrink: 0,
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    padding: 8,
  },
})
