/**
 * LocalMusic - 本地音乐播放器
 * 递归扫描音频文件,点击立即播放并切换播放列表
 */
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { View, FlatList, TouchableOpacity, Alert } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { scanAudioFiles, readMetadata } from '@/utils/localMediaMetadata'
import { toast } from '@/utils/tools'
import { setTempList } from '@/core/list'
import RNFS from 'react-native-fs'
import { setPlayList } from '@/core/player/player'
import { playList } from '@/core/player/player'
import { LIST_IDS } from '@/config/constant'
import ChoosePath, { type ChoosePathType } from '@/components/common/ChoosePath'
import { useI18n } from '@/lang'

interface LocalFile {
  name: string
  path: string
}

export default memo(() => {
  const theme = useTheme()
  const t = useI18n()
  const [files, setFiles] = useState<LocalFile[]>([])
  const [scanning, setScanning] = useState(false)
  const choosePathRef = useRef<ChoosePathType>(null)

  const SCAN_CACHE_FILE = `${RNFS.DocumentDirectoryPath}/lx_local_music_cache.json`

  // 启动时加载缓存
  useEffect(() => {
    (async () => {
      try {
        const exists = await RNFS.exists(SCAN_CACHE_FILE)
        if (exists) {
          const data = await RNFS.readFile(SCAN_CACHE_FILE, 'utf8')
          setFiles(JSON.parse(data))
        }
      } catch {}
    })()
  }, [])

  const saveFilesToCache = useCallback(async (fileList: typeof files) => {
    try {
      await RNFS.writeFile(SCAN_CACHE_FILE, JSON.stringify(fileList), 'utf8')
    } catch {}
  }, [])

  const scanDirectory = useCallback(async (dirPath: string) => {
    if (scanning) return
    setScanning(true)
    try {
      const audioFiles = await scanAudioFiles(dirPath, true)
      setFiles(audioFiles)
      await saveFilesToCache(audioFiles)
      toast(`找到 ${audioFiles.length} 个音频文件`)
    } catch (err: any) {
      toast(`扫描失败: ${err.message}`)
    }
    setScanning(false)
  }, [scanning, saveFilesToCache])

  const handlePlayFromIndex = useCallback(async (index: number) => {
    if (files.length === 0) return
    try {
      const musicList = files.map((f, i) => {
        const ext = f.name.includes('.') ? f.name.split('.').pop() || '' : ''
        return {
          id: f.path,
          name: f.name.replace(/\.[^/.]+$/, ''),
          singer: '本地文件',
          source: 'local' as const,
          quality: 'unknown',
          interval: null,
          meta: { filePath: f.path, ext },
        }
      })
      await setTempList('local_temp', musicList as any)
      await playList(LIST_IDS.TEMP, index)
    } catch (err: any) {
      toast(`播放失败: ${err.message}`)
    }
  }, [files])

  const handleScanMusicDir = useCallback(() => {
    void scanDirectory('/storage/emulated/0/Music')
  }, [scanDirectory])

  const handleScanDownload = useCallback(() => {
    void scanDirectory('/storage/emulated/0/Download')
  }, [scanDirectory])

  const handleCustomDir = useCallback(() => {
    choosePathRef.current?.show({
      title: '选择音频目录',
      dirOnly: true,
    })
  }, [])

  const handleConfirmPath = useCallback((path: string) => {
    void scanDirectory(path)
  }, [scanDirectory])

  const renderItem = ({ item, index }: { item: LocalFile; index: number }) => {
    const title = item.name.replace(/\.[^/.]+$/, '')
    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => handlePlayFromIndex(index)}
        activeOpacity={0.7}
      >
        <View style={styles.itemIcon}>
          <Text size={20} color={theme['c-primary']}>🎵</Text>
        </View>
        <View style={styles.itemContent}>
          <Text size={14} color={theme['c-primary-font']} numberOfLines={1}>{title}</Text>
          <Text size={12} color={theme['c-font-label']} numberOfLines={1}>{item.path}</Text>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text size={16} color={theme['c-primary-font']}>本地音乐</Text>
        {files.length > 0 && (
          <Text size={12} color={theme['c-font-label']}>{files.length} 个文件</Text>
        )}
      </View>

      <View style={styles.scanBtns}>
        <TouchableOpacity style={[styles.scanBtn, scanning && { opacity: 0.5 }]} onPress={handleScanMusicDir} disabled={scanning}>
          <Text size={13} color={theme['c-primary']}>{scanning ? '扫描中...' : 'Music 目录'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.scanBtn, scanning && { opacity: 0.5 }]} onPress={handleScanDownload} disabled={scanning}>
          <Text size={13} color={theme['c-primary']}>{scanning ? '扫描中...' : 'Download 目录'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.scanBtn, scanning && { opacity: 0.5 }]} onPress={handleCustomDir} disabled={scanning}>
          <Text size={13} color={theme['c-primary']}>选择目录</Text>
        </TouchableOpacity>
      </View>

      {files.length === 0 ? (
        <View style={styles.empty}>
          <Text size={20} color={theme['c-font-label']}>📁</Text>
          <Text size={14} color={theme['c-font-label']} style={{ marginTop: 8 }}>
            扫描本地音乐文件后,点击歌曲即可播放
          </Text>
        </View>
      ) : (
        <FlatList
          data={files}
          keyExtractor={(item) => item.path}
          renderItem={renderItem}
          style={styles.list}
        />
      )}
      <ChoosePath ref={choosePathRef} onConfirm={handleConfirmPath} />
    </View>
  )
})

const styles = createStyle({
  container: { flex: 1, padding: 15 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  scanBtns: { flexDirection: 'row', marginBottom: 12, gap: 8 },
  scanBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: 'rgba(128,128,128,0.08)', borderRadius: 8 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { flex: 1 },
  item: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 6, backgroundColor: 'rgba(128,128,128,0.06)', borderRadius: 8 },
  itemIcon: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  itemContent: { flex: 1, marginLeft: 10 },
})
