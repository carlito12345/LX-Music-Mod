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
import { addListMusics } from '@/core/list'
import RNFS from 'react-native-fs'

const STATUS_TEXT_MAP = {
  run: 'download_status_downloading',
  waiting: 'download_status_waiting',
  pause: 'download_status_paused',
  error: 'download_status_failed',
  completed: 'download_status_completed',
} as const

export default memo(({ item }: {
  item: LX.Download.ListItem
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

  const handlePlay = useCallback(async () => {
    if (item.status !== 'completed' || !item.metadata.filePath) return
    try {
      const exists = await RNFS.exists(item.metadata.filePath)
      if (!exists) {
        toast(t('download_file_not_found'))
        return
      }
      const tempMusicInfo = {
        ...item.metadata.musicInfo,
        meta: {
          ...item.metadata.musicInfo.meta,
          filePath: item.metadata.filePath,
        },
      }
      await addListMusics(LIST_IDS.TEMP, [tempMusicInfo])
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
      case 'share':
        if (item.metadata.musicInfo) {
          shareMusic(item.metadata.musicInfo)
        }
        break
      case 'delete':
        const confirm = await confirmDialog({
          message: t('download_delete_confirm'),
          bgClose: false,
        })
        if (confirm) {
          await downloadManager.deleteTask(item.id)
        }
        break
      case 'deleteFile':
        if (item.metadata.filePath) {
          const confirmFile = await confirmDialog({
            message: t('download_delete_file_confirm'),
            bgClose: false,
          })
          if (confirmFile) {
            try {
              await RNFS.unlink(item.metadata.filePath)
              toast(t('download_file_deleted'))
              await downloadManager.deleteTask(item.id)
            } catch (err: any) {
              toast(t('download_delete_file_failed') + ': ' + err.message)
            }
          }
        }
        break
    }
  }, [item, t])

  const isCompleted = item.status === 'completed'
  const isError = item.status === 'error'

  const menus = [
    { action: 'share', label: t('share') },
    { action: 'delete', label: t('download_delete') },
  ]
  if (isCompleted && item.metadata.filePath) {
    menus.push({ action: 'deleteFile', label: t('download_delete_file') })
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
          <Text numberOfLines={1} size={14} color={theme['c-font']}>{item.metadata.musicInfo.name}</Text>
          <Text numberOfLines={1} size={12} color={theme['c-font-label']}>{item.metadata.musicInfo.singer}</Text>
          <View style={styles.statusRow}>
            <Text size={12} color={isError ? theme['c-error'] : theme['c-font-label']}>
              {t(STATUS_TEXT_MAP[item.status])}
              {isError && item.statusText ? `: ${item.statusText}` : ''}
            </Text>
            {
              item.status === 'run'
                ? <Text size={12} color={theme['c-font-label']}>{item.speed}</Text>
                : null
            }
            {
              isCompleted
                ? <Text size={12} color={theme['c-font-label']}>{(item.total / 1024 / 1024).toFixed(1)} MB</Text>
                : null
            }
          </View>
          {
            item.status === 'run'
              ? <View style={styles.progressBar}>
                  <View style={{ ...styles.progressFill, width: `${item.progress * 100}%`, backgroundColor: theme['c-primary'] }} />
                </View>
              : null
          }
        </View>
        <View style={styles.action}>
          <Text style={styles.deleteBtn} onPress={handleDelete} color={theme['c-error']}>{t('download_delete')}</Text>
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
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  action: {
    flexShrink: 0,
  },
  deleteBtn: {
    padding: 8,
  },
})
