/**
 * download.ts - 歌曲下载核心模块
 * 下载到公共 Music/LXMusic 目录
 */
import RNFS from 'react-native-fs'
import { getMusicUrl } from './music'
import type { MusicInfoOnline } from '@/types/music'
import { toast } from '@/utils/tools'
import { PermissionsAndroid, Platform, Linking, Alert } from 'react-native'
import settingState from '@/store/setting/state'
import { writePic, writeLyric, writeMetadata } from 'react-native-local-media-metadata'
import { getPicUrl as getOnlinePicUrl, getLyricInfo as getOnlineLyricInfo } from '@/core/music/online'
import { temporaryDirectoryPath } from 'react-native-fs'

export interface DownloadTask {
  id: string
  musicInfo: MusicInfoOnline
  quality: string
  progress: number
  status: 'waiting' | 'downloading' | 'completed' | 'failed'
  url?: string
  error?: string
  filePath?: string
}

export const DOWNLOAD_QUALITIES = [
  { id: '128k', label: '标准 (128k)', ext: 'mp3' },
  { id: '192k', label: '高品 (192k)', ext: 'mp3' },
  { id: '320k', label: '超高品 (320k)', ext: 'mp3' },
  { id: 'ape', label: '无损 APE', ext: 'ape' },
  { id: 'flac', label: '无损 FLAC', ext: 'flac' },
] as const

const downloadQueue: Map<string, DownloadTask> = new Map()
const listeners: Set<(tasks: DownloadTask[]) => void> = new Set()

const notify = () => {
  const list = Array.from(downloadQueue.values())
  for (const fn of listeners) fn(list)
  // 持久化保存
  saveQueueToFile().catch(() => {})
}

const QUEUE_FILE = `${RNFS.DocumentDirectoryPath}/lxmusic_download_queue.json`

const saveQueueToFile = async () => {
  const list = Array.from(downloadQueue.values())
  const data = list.map(t => ({
    id: t.id, musicInfo: t.musicInfo, quality: t.quality,
    progress: t.progress, status: t.status, url: t.url,
    error: t.error, filePath: t.filePath
  }))
  await RNFS.writeFile(QUEUE_FILE, JSON.stringify(data), 'utf8')
}

const loadQueueFromFile = async () => {
  try {
    const exists = await RNFS.exists(QUEUE_FILE)
    if (!exists) return
    const data = await RNFS.readFile(QUEUE_FILE, 'utf8')
    const tasks: DownloadTask[] = JSON.parse(data)
    downloadQueue.clear()
    for (const t of tasks) {
      if (t.status === 'downloading') t.status = 'waiting' // 重置下载中的任务
      downloadQueue.set(t.id, t)
    }
    notify()
  } catch {}
}

// 启动时加载
loadQueueFromFile().catch(() => {})

const getDownloadDir = (): string => {
  const customDir = settingState.setting['download.dir']
  if (customDir && customDir.trim()) {
    return customDir.trim()
  }
  if (Platform.OS === 'android') {
    return `${RNFS.ExternalStorageDirectoryPath}/Music/LXMusic`
  }
  return `${RNFS.DocumentDirectoryPath}/lxmusic_downloads`
}

// 打开系统存储管理设置(Android 11+)
const openManageStorageSettings = async (): Promise<void> => {
  try {
    await Linking.openURL('package:cn.toside.music.mobile')
  } catch {
    await Linking.openSettings()
  }
}

export const requestStoragePermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true

  try {
    if (Platform.Version >= 30) {
      // 使用 PermissionsAndroid.check 验证 MANAGE_EXTERNAL_STORAGE
      try {
        // 尝试使用 RNFS 的 ExternalStorageDirectoryPath
        const testDir = `${RNFS.ExternalStorageDirectoryPath}/Music/LXMusic`
        await RNFS.mkdir(testDir)
        const testFile = `${testDir}/.permission_test`
        await RNFS.writeFile(testFile, 'test', 'utf8')
        await RNFS.unlink(testFile)
        return true
      } catch (err) {
        // 如果直接写入失败,可能是权限未授予
        // 先检查是否已有 MANAGE_EXTERNAL_STORAGE 权限
        try {
          const hasManageStorage = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
          )
          if (hasManageStorage) {
            // 有权限但写入失败,尝试使用 DocumentDirectoryPath
            const docDir = `${RNFS.DocumentDirectoryPath}/lxmusic_downloads`
            await RNFS.mkdir(docDir)
            return true
          }
        } catch {}
        
        return new Promise<boolean>((resolve) => {
          Alert.alert(
            '需要存储权限',
            '下载音乐文件需要"所有文件管理"权限,请在系统设置中开启',
            [
              { text: '取消', onPress: () => resolve(false), style: 'cancel' },
              { 
                text: '去设置', 
                onPress: async () => {
                  try {
                    await openManageStorageSettings()
                    setTimeout(() => {
                      // 再次检查权限
                      try {
                        PermissionsAndroid.check(
                          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
                        ).then(granted => {
                          resolve(granted)
                        }).catch(() => resolve(false))
                      } catch {
                        resolve(false)
                      }
                    }, 2000)
                  } catch {
                    resolve(false)
                  }
                }
              },
            ]
          )
        })
      }
    }

    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      {
        title: '存储权限',
        message: '下载音乐文件需要存储权限,请允许访问',
        buttonPositive: '允许',
        buttonNegative: '拒绝',
      }
    )
    if (granted === PermissionsAndroid.RESULTS.GRANTED) return true

    return new Promise<boolean>((resolve) => {
      Alert.alert(
        '需要存储权限',
        '下载音乐文件需要存储权限,请在系统设置中手动开启',
        [
          { text: '取消', onPress: () => resolve(false), style: 'cancel' },
          { 
            text: '去设置', 
            onPress: async () => {
              try {
                await Linking.openSettings()
                setTimeout(async () => {
                  const granted = await PermissionsAndroid.check(
                    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
                  )
                  resolve(granted)
                }, 500)
              } catch {
                resolve(false)
              }
            }
          },
        ]
      )
    })
  } catch {
    return false
  }
}

export const addDownload = async (musicInfo: MusicInfoOnline, quality: string = '320k') => {
  const queueKey = `${musicInfo.id}_${quality}`
  if (downloadQueue.has(queueKey)) {
    toast('已在下载队列中')
    return
  }
  const task: DownloadTask = {
    id: queueKey,
    musicInfo,
    quality,
    progress: 0,
    status: 'waiting',
  }
  downloadQueue.set(queueKey, task)
  notify()
  const qualityInfo = DOWNLOAD_QUALITIES.find(q => q.id === quality)
  toast(`开始下载: ${musicInfo.name} (${qualityInfo?.label || quality})`)
  startDownload(task).catch(err => {
    console.error('Download error:', err)
    toast(`下载失败: ${musicInfo.name}`)
  })
}

const startDownload = async (task: DownloadTask) => {
  try {
    task.status = 'downloading'
    task.progress = 0
    notify()

    const hasPermission = await requestStoragePermission()
    if (!hasPermission) {
      throw new Error('未获得存储权限,请在设置中开启')
    }

    const url = await getMusicUrl({
      musicInfo: task.musicInfo,
      quality: task.quality as any,
    })

    if (!url) {
      throw new Error('无法获取下载链接')
    }

    task.url = url
    notify()

    const qualityInfo = DOWNLOAD_QUALITIES.find(q => q.id === task.quality)
    const ext = qualityInfo?.ext || 'mp3'
    const safeName = (task.musicInfo.name || 'unknown').replace(/[\\/:*?"<>|]/g, '_')
    const safeSinger = (task.musicInfo.singer || 'unknown').replace(/[\\/:*?"<>|]/g, '_')
    const fileName = `${safeName} - ${safeSinger}.${ext}`
    const downloadDir = getDownloadDir()
    await RNFS.mkdir(downloadDir)
    const filePath = `${downloadDir}/${fileName}`
    task.filePath = filePath

    // 文件存在冲突检测
    if (await RNFS.exists(filePath)) {
      const conflictAction = settingState.setting['download.conflictAction'] || 'overwrite'
      if (conflictAction === 'skip') {
        task.status = 'completed'
        task.progress = 1
        task.filePath = filePath
        notify()
        toast(`已跳过: ${task.musicInfo.name} (文件已存在)`)
        return
      } else {
        // overwrite - 删除旧文件重新下载
        await RNFS.unlink(filePath)
      }
    }

    const result = RNFS.downloadFile({
      fromUrl: url,
      toFile: filePath,
      progress: (res) => {
        // 处理 contentLength 为 -1 或 0 的情况
        if (res.contentLength > 0) {
          task.progress = res.bytesWritten / res.contentLength
        } else {
          // 如果无法获取总长度,至少显示已下载字节数
          task.progress = Math.min(0.99, res.bytesWritten / (1024 * 1024 * 10)) // 假设 10MB
        }
        notify()
      },
      progressInterval: 200, // 每 200ms 更新一次进度
    })

    await result.promise
    
    // 下载完成后验证文件存在
    const exists = await RNFS.exists(filePath)
    if (!exists) {
      throw new Error('下载文件不存在')
    }

    task.status = 'completed'
    task.progress = 1
    notify()
    // 写入 ID3 标签(封面、歌词、元数据)
    writeId3Tags(task).catch(err => {
      console.warn('[Download] ID3 write warning:', err)
    })
    toast(`下载完成: ${task.musicInfo.name}`)
  } catch (err: any) {
    task.status = 'failed'
    task.error = err.message || String(err)
    task.progress = 0
    notify()
    toast(`下载失败: ${task.musicInfo.name} - ${err.message || '未知错误'}`)
  }
}

const writeId3Tags = async (task: DownloadTask) => {
  try {
    if (!task.filePath) return
    const musicInfo = task.musicInfo
    const filePath = task.filePath

    // 1. 写入元数据(标题、艺术家)
    try {
      await writeMetadata(filePath, {
        name: musicInfo.name || 'Unknown',
        singer: musicInfo.singer || 'Unknown',
        albumName: (musicInfo as any).album || '',
      }, true)
    } catch { }

    // 2. 写入封面图片
    try {
      const picUrl = await getOnlinePicUrl({
        musicInfo: musicInfo as LX.Music.MusicInfoOnline,
        isRefresh: false,
        allowToggleSource: false,
      }).catch(() => null)
      if (picUrl) {
        const picPath = `${temporaryDirectoryPath}/lx_dl_cover_${Date.now()}.jpg`
        await RNFS.downloadFile({ fromUrl: picUrl, toFile: picPath }).promise
        await writePic(filePath, picPath)
        // 清理临时文件
        RNFS.unlink(picPath).catch(() => {})
      }
    } catch { }

    // 3. 写入歌词
    try {
      const lyricInfo = await getOnlineLyricInfo({
        musicInfo: musicInfo as LX.Music.MusicInfoOnline,
        isRefresh: false,
        allowToggleSource: false,
      }).catch(() => null)
      if (lyricInfo && lyricInfo.lyric) {
        await writeLyric(filePath, lyricInfo.lyric)
      }
    } catch { }
  } catch (err) {
    console.warn('[Download] ID3 write error:', err)
  }
}

export const subscribeDownloads = (fn: (tasks: DownloadTask[]) => void) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export const getDownloadList = () => Array.from(downloadQueue.values())

export const clearCompleted = () => {
  for (const [k, v] of downloadQueue) {
    if (v.status === 'completed') downloadQueue.delete(k)
  }
  notify()
}

export const removeTask = (id: string) => {
  downloadQueue.delete(id)
  notify()
}
