/**
 * PlayQueue - 播放队列页面
 * 全屏展示当前播放队列,UI 跟随播放器风格
 */
import { memo, useCallback, useEffect, useState } from 'react'
import { View, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { BlurView } from '@react-native-community/blur'
import { pop } from '@/navigation'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import { getContrastTextColor, getSecondaryTextColor, getFrostedGlassBg } from '@/utils/colorContrast'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import playerState from '@/store/player/state'
import { playList } from '@/core/player/player'
import { removeTempPlayList, clearTempPlayeList } from '@/core/player/tempPlayList'
import { LIST_IDS } from '@/config/constant'
import StatusBar from '@/components/common/StatusBar'
import { toast } from '@/utils/tools'

export interface PlayQueueProps {
  componentId: string
}

export default memo(({ componentId }: PlayQueueProps) => {
  const theme = useTheme()
  const [tempPlayList, setTempPlayList] = useState(playerState.tempPlayList)
  const [playMusicInfo, setPlayMusicInfo] = useState(playerState.playMusicInfo)

  // 监听播放队列变化
  useEffect(() => {
    const handleChange = () => {
      setTempPlayList([...playerState.tempPlayList])
      setPlayMusicInfo({ ...playerState.playMusicInfo })
    }
    global.state_event.on('playTempPlayListChanged', handleChange)
    global.state_event.on('playMusicInfoUpdated', handleChange)
    return () => {
      global.state_event.off('playTempPlayListChanged', handleChange)
      global.state_event.off('playMusicInfoUpdated', handleChange)
    }
  }, [])

  // 合并当前播放列表和稍后播放列表
  const allQueue = [
    ...(playMusicInfo.musicInfo ? [playMusicInfo] : []),
    ...tempPlayList,
  ]

  const bgColor = theme['c-content-background'] || '#1a1a2e'
  const textColor = getContrastTextColor(bgColor)
  const secondaryColor = getSecondaryTextColor(bgColor)
  const glassBg = getFrostedGlassBg(bgColor)

  const handleBack = () => {
    void pop(componentId)
  }

  const handlePlay = useCallback((index: number) => {
    if (index === 0 && playMusicInfo.musicInfo) {
      // 当前正在播放的歌曲,不做操作
      return
    }
    // 从稍后播放列表中播放
    const realIndex = index - (playMusicInfo.musicInfo ? 1 : 0)
    if (realIndex >= 0) {
      // 通过跳转到对应索引播放
      playList(LIST_IDS.TEMP, realIndex).catch(() => {
        toast('播放失败')
      })
    }
    void pop(componentId)
  }, [componentId, playMusicInfo])

  const handleRemove = useCallback((index: number) => {
    if (index === 0 && playMusicInfo.musicInfo) {
      toast('无法移除当前播放歌曲')
      return
    }
    const realIndex = index - (playMusicInfo.musicInfo ? 1 : 0)
    if (realIndex >= 0) {
      removeTempPlayList(realIndex)
    }
  }, [playMusicInfo])

  const handleClear = () => {
    clearTempPlayeList()
    toast('已清空播放队列')
  }

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const isCurrent = index === 0 && playMusicInfo.musicInfo
    const musicName = item.musicInfo?.name || item.name || '未知歌曲'
    const singer = item.musicInfo?.singer || item.singer || '未知艺术家'
    return (
      <TouchableOpacity
        style={[styles.item, isCurrent && { backgroundColor: 'rgba(128,128,128,0.1)' }]}
        onPress={() => handlePlay(index)}
        onLongPress={() => handleRemove(index)}
        activeOpacity={0.7}
      >
        <View style={styles.itemIcon}>
          <Text size={isCurrent ? 16 : 12} color={theme['c-primary']}>
            {isCurrent ? '▶' : '♪'}
          </Text>
        </View>
        <View style={styles.itemContent}>
          <Text size={14} color={isCurrent ? theme['c-primary'] : textColor} numberOfLines={1}>
            {musicName}
          </Text>
          <Text size={12} color={secondaryColor} numberOfLines={1}>
            {singer}
          </Text>
        </View>
        <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(index)}>
          <Text size={14} color={secondaryColor}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar />
      
      {/* 磨砂玻璃头部 */}
      <View style={styles.header}>
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="dark"
          blurAmount={15}
          reducedTransparencyFallbackColor={glassBg}
        />
        <View style={[styles.headerOverlay, { backgroundColor: glassBg }]} />
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
              <Text size={13} color={theme['c-primary']}>清空</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 队列列表 */}
      {allQueue.length === 0 ? (
        <View style={styles.empty}>
          <Text size={16} color={secondaryColor}>队列为空</Text>
          <Text size={13} color={secondaryColor} style={{ marginTop: 8 }}>从歌单中选择歌曲播放</Text>
        </View>
      ) : (
        <FlatList
          data={allQueue}
          keyExtractor={(_, index) => String(index)}
          renderItem={renderItem}
          style={styles.list}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 56, position: 'relative' },
  headerOverlay: { ...StyleSheet.absoluteFillObject },
  headerContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 },
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
