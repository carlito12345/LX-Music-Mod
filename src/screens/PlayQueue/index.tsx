/**
 * PlayQueue - 播放队列页面
 * 同步播放器背景/文字颜色
 */
import { memo, useCallback, useEffect, useState } from 'react'
import { View, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { pop } from '@/navigation'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { getContrastTextColor, getSecondaryTextColor } from '@/utils/colorContrast'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'

import { playList } from '@/core/player/player'
import { removeTempPlayList, clearTempPlayeList } from '@/core/player/tempPlayList'
import { getListMusics } from '@/core/list'
import { LIST_IDS } from '@/config/constant'
import StatusBar from '@/components/common/StatusBar'
import playerState from '@/store/player/state'
import { scanAudioFiles } from '@/utils/localMediaMetadata'
import { setTempList } from '@/core/list'
import RNFS from 'react-native-fs'
import { toast } from '@/utils/tools'



export interface PlayQueueProps { componentId: string; initialQueue?: any[]; listId?: string }

export default memo(({ componentId, initialQueue = [] }: PlayQueueProps) => {
  const t = (global.i18n?.t) || ((s: string) => s)
  
  const theme = useTheme()
  const mi = usePlayerMusicInfo()
  const followCover = useSettingValue('playDetail.background.followCover')
  const solidColor = useSettingValue('playDetail.background.solidColor')

  const [currentListSongs, setCurrentListSongs] = useState<any[]>([])
  const [tempPlayList, setTempPlayList] = useState(playerState.tempPlayList)
  const [playMusicInfo, setPlayMusicInfo] = useState(playerState.playMusicInfo)
  const [playerListId, setPlayerListId] = useState<string | null>(playerState.playInfo.playerListId)

  useEffect(() => {
    const handleChange = () => {
      setTempPlayList([...playerState.tempPlayList])
      setPlayMusicInfo({ ...playerState.playMusicInfo })
      setPlayerListId(playerState.playInfo.playerListId)
    }
    global.state_event?.on('playTempPlayListChanged', handleChange)
    global.state_event?.on('playMusicInfoUpdated', handleChange)
    return () => {
      global.state_event?.off('playTempPlayListChanged', handleChange)
      global.state_event?.off('playMusicInfoUpdated', handleChange)
    }
  }, [])

  // 加载当前播放列表全部歌曲
  useEffect(() => {
    const targetId = playerListId || LIST_IDS.TEMP
    if (initialQueue && initialQueue.length > 0 && currentListSongs.length === 0) {
      setCurrentListSongs(initialQueue)
      return
    }
    // 播放器队列数据已由 pushPlayQueueScreen 通过 initialQueue 传递
  }, [playMusicInfo, playerListId])

  // 背景 & 文字颜色(同步播放器设置)
  const rawBg = (() => {
    if (followCover && mi.pic) return mi.pic || theme['c-content-background']
    return solidColor || theme['c-content-background']
  })()

  const bgColor = (rawBg || '#1a1a2e').startsWith('#') ? (rawBg || '#1a1a2e') : '#1a1a2e'
  const textColor = getContrastTextColor(bgColor)
  const secondaryColor = getSecondaryTextColor(bgColor)

  // 半透明背景
  const c = bgColor.replace('#', '')
  const r = parseInt(c.substring(0, 2), 16)
  const g = parseInt(c.substring(2, 4), 16)
  const b = parseInt(c.substring(4, 6), 16)
  const bgRgba = isNaN(r) || isNaN(g) || isNaN(b) ? 'rgba(26,26,46,0.3)' : `rgba(${r},${g},${b},0.3)`

  // 当前歌曲 ID
  const currentItemId = playMusicInfo.musicInfo?.id

  // 合并队列
  const allQueue = [
    ...currentListSongs,
    ...tempPlayList.map((t: any) => t.musicInfo).filter(Boolean),
  ]

  const handleBack = () => { void pop(componentId) }

  const handlePlay = useCallback((index: number) => {
    const item = allQueue[index]
    if (!item) { toast('无法播放'); return }
    if (item.id === currentItemId) { void pop(componentId); return }

    const songId = item.musicInfo?.id || item.id || ''
    const listId = playerState.playInfo.playerListId

    // 在 playerListId 对应的完整歌曲列表中查找
    const targetListId = listId || LIST_IDS.TEMP
    const fullList = getList(targetListId) as any[]
    const realIdx = fullList?.findIndex((s: any) => (s.id || '') === songId) ?? -1
      if (realIdx >= 0) {
        void playList(targetListId, realIdx).catch(() => toast('播放失败'))
      } else {
        // 尝试在稍后播放中查找
        const tidx = playerState.tempPlayList.findIndex((t: any) => (t.musicInfo?.id || t.id || '') === songId)
        if (tidx >= 0) {
          void playList(LIST_IDS.TEMP, tidx).catch(() => toast('播放失败'))
        } else {
          toast('歌曲不在队列中')
        }
      }
    void pop(componentId)
  }, [allQueue, currentItemId])

  const handleRemove = useCallback((index: number) => {
    const item = allQueue[index]
    if (!item || item.id === currentItemId) return
    const tidx = playerState.tempPlayList.findIndex((t: any) => t.musicInfo?.id === item.id)
    if (tidx >= 0) removeTempPlayList(tidx)
  }, [allQueue, currentItemId])

  const handleClear = () => { clearTempPlayeList(); toast('已清空') }
  
  const handleLoadLocalMusic = async () => {
    try {
      const dirs = ['/storage/emulated/0/Music', '/storage/emulated/0/Download']
      let allFiles: {name: string; path: string}[] = []
      for (const dir of dirs) {
        try {
          const files = await scanAudioFiles(dir, true)
          allFiles = allFiles.concat(files)
        } catch {}
      }
      if (allFiles.length === 0) { toast('未找到本地音频文件'); return }
      const musicList = allFiles.map(f => ({
        id: f.path,
        name: f.name.replace(/\.[^/.]+$/, ''),
        singer: '本地文件',
        source: 'local' as const,
        quality: 'unknown',
        interval: null,
        meta: { filePath: f.path, ext: f.name.includes('.') ? f.name.split('.').pop() || '' : '' },
      }))
      await setTempList('local_queue', musicList as any)
      setCurrentListSongs(musicList as any)
      toast(`已加载 ${musicList.length} 首本地歌曲`)
    } catch (err: any) {
      toast(`加载失败: ${err.message}`)
    }
  }

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const isCurrent = item.id === currentItemId
    const name = item.musicInfo?.name || item.name || ''
    const singer = item.musicInfo?.singer || item.singer || ''
    const primaryColor = theme['c-primary'] || '#07c556'
    // 当前歌曲: 主题色背景 + 自动黑白对比文字
    const currentBg = primaryColor + '30' // 约 19% 透明度
    const currentText = getContrastTextColor(primaryColor)
    return (
      <TouchableOpacity
        style={[styles.item, isCurrent && { backgroundColor: currentBg, borderLeftWidth: 3, borderLeftColor: primaryColor }]}
        onPress={() => handlePlay(index)}
        onLongPress={() => handleRemove(index)}
        activeOpacity={0.6}
      >
        <View style={styles.itemIcon}>
          <Text size={16} color={isCurrent ? currentText : secondaryColor}>{isCurrent ? '▶' : '♪'}</Text>
        </View>
        <View style={styles.itemContent}>
          <Text size={14} color={isCurrent ? currentText : textColor} numberOfLines={1} style={isCurrent ? { fontWeight: 'bold', fontSize: 15 } : {}}>{name}</Text>
          <Text size={12} color={isCurrent ? currentText : secondaryColor} numberOfLines={1} style={isCurrent ? { opacity: 0.8 } : {}}>{singer}</Text>
        </View>
        {!isCurrent && (
          <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(index)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text size={14} color={secondaryColor}>✕</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: bgRgba }]}>
      <StatusBar />
      <View style={styles.headerContent}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Icon name="chevron-left" size={22} color={textColor} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text size={17} color={textColor}>播放队列</Text>
          <Text size={12} color={secondaryColor}>{allQueue.length} 首</Text>
        </View>
        {allQueue.length > 1 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
            <Text size={13} color={theme['c-primary'] || '#07c556'}>清空</Text>
          </TouchableOpacity>
        )}
      </View>
      {allQueue.length === 0 ? (
        <View style={styles.empty}>
          <Text size={16} color={secondaryColor}>队列为空</Text>
          <Text size={13} color={secondaryColor} style={{ marginTop: 8 }}>从歌单中选择歌曲播放</Text>
        </View>
      ) : (
        <FlatList data={allQueue} keyExtractor={(_, i) => String(i)} renderItem={renderItem} style={styles.list} contentContainerStyle={{ paddingBottom: 40 }} />
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, height: 50 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, marginLeft: 8 },
  clearBtn: { paddingVertical: 8, paddingHorizontal: 12 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { flex: 1 },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: 'rgba(128,128,128,0.15)' },
  itemIcon: { width: 30, alignItems: 'center' },
  itemContent: { flex: 1, marginHorizontal: 10 },
  removeBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
})
