import { saveLyric, saveMusicUrl } from '@/utils/data'
import { updateListMusics } from '@/core/list'
import {
  buildLyricInfo,
  getCachedLyricInfo,
  getOnlineOtherSourceLyricByLocal,
  getOnlineOtherSourceLyricInfo,
  getOnlineOtherSourceMusicUrl,
  getOnlineOtherSourceMusicUrlByLocal,
  getOnlineOtherSourcePicByLocal,
  getOnlineOtherSourcePicUrl,
  getOtherSource,
} from './utils'
import { getLocalFilePath } from '@/utils/music'
import { readLyric, readPic } from '@/utils/localMediaMetadata'
import { stat } from '@/utils/fs'

const getOtherSourceByLocal = async<T>(musicInfo: LX.Music.MusicInfoLocal, handler: (infos: LX.Music.MusicInfoOnline[]) => Promise<T>) => {
  let result: LX.Music.MusicInfoOnline[] = []
  result = await getOtherSource(musicInfo)
  if (result.length) try { return await handler(result) } catch {}
  if (musicInfo.name.includes('-')) {
    const [name, singer] = musicInfo.name.split('-').map(val => val.trim())
    result = await getOtherSource({
      ...musicInfo,
      name,
      singer,
    }, true)
    if (result.length) try { return await handler(result) } catch {}
    result = await getOtherSource({
      ...musicInfo,
      name: singer,
      singer: name,
    }, true)
    if (result.length) try { return await handler(result) } catch {}
  }
  let fileName = (await stat(musicInfo.meta.filePath).catch(() => ({ name: null }))).name ?? musicInfo.meta.filePath.split(/\/|\\/).at(-1)
  if (fileName) {
    fileName = fileName.substring(0, fileName.lastIndexOf('.'))
    if (fileName != musicInfo.name) {
      if (fileName.includes('-')) {
        const [name, singer] = fileName.split('-').map(val => val.trim())
        result = await getOtherSource({
          ...musicInfo,
          name,
          singer,
        }, true)
        if (result.length) try { return await handler(result) } catch {}
        result = await getOtherSource({
          ...musicInfo,
          name: singer,
          singer: name,
        }, true)
      } else {
        result = await getOtherSource({
          ...musicInfo,
          name: fileName,
          singer: '',
        }, true)
      }
      if (result.length) try { return await handler(result) } catch {}
    }
  }

  throw new Error('source not found')
}

export const getMusicUrl = async({ musicInfo, isRefresh, allowToggleSource = true, onToggleSource = () => {} }: {
  musicInfo: LX.Music.MusicInfoLocal
  isRefresh: boolean
  onToggleSource?: (musicInfo?: LX.Music.MusicInfoOnline) => void
  allowToggleSource?: boolean
}): Promise<string> => {
  const filePath = musicInfo.meta?.filePath

  // 本地文件保护:有文件路径就直接播放,不搜索网络
  if (filePath && !isRefresh) {
    // 先尝试检查文件是否存在
    try {
      const path = await getLocalFilePath(musicInfo)
      if (path) return path
    } catch (e) {
      console.log('[LocalMusic] File check failed:', String(e).substring(0, 50))
    }

    // existsFile 失败或返回空,但路径有效就直接返回
    if (filePath.startsWith('/storage/') || filePath.startsWith('/data/') || filePath.startsWith('/sdcard/') || filePath.startsWith('/')) {
      console.log('[LocalMusic] Using file path directly:', filePath)
      return filePath
    }

    // 路径无效或文件不存在,直接报错
    console.error('[LocalMusic] Invalid file path:', filePath)
    throw new Error('local file not accessible: ' + filePath)
  }

  // 没有 filePath 的才走网络搜索(保持原有逻辑)
  try {
    return await getOnlineOtherSourceMusicUrlByLocal(musicInfo, isRefresh).then(({ url, quality, isFromCache }) => {
      if (!isFromCache) void saveMusicUrl(musicInfo, quality, url)
      return url
    })
  } catch {}

  if (!allowToggleSource) throw new Error('failed')

  onToggleSource()
  return getOtherSourceByLocal(musicInfo, async(otherSource) => {
    return getOnlineOtherSourceMusicUrl({ musicInfos: [...otherSource], onToggleSource, isRefresh }).then(({ url, quality: targetQuality, musicInfo: targetMusicInfo, isFromCache }) => {
      if (!isFromCache) void saveMusicUrl(targetMusicInfo, targetQuality, url)
      return url
    })
  })
}

export const getPicUrl = async({ musicInfo, listId, isRefresh, skipFilePic, onToggleSource = () => {} }: {
  musicInfo: LX.Music.MusicInfoLocal
  listId?: string | null
  isRefresh: boolean
  skipFilePic?: boolean
  onToggleSource?: (musicInfo?: LX.Music.MusicInfoOnline) => void
}): Promise<string> => {
  if (!isRefresh && !skipFilePic) {
    try {
      let pic = await readPic(musicInfo.meta.filePath).catch(() => null)
      if (pic) {
        if (pic.startsWith('/')) pic = `file://${pic}`
        return pic
      }
    } catch {}

    if (musicInfo.meta.picUrl) return musicInfo.meta.picUrl
  }

  // 保持原有逻辑:尝试从网络获取
  try {
    return await getOnlineOtherSourcePicByLocal(musicInfo).then(({ url }) => url)
  } catch {}

  onToggleSource()
  try {
    return await getOtherSourceByLocal(musicInfo, async(otherSource) => {
      return getOnlineOtherSourcePicUrl({ musicInfos: [...otherSource], onToggleSource, isRefresh }).then(({ url, musicInfo: targetMusicInfo, isFromCache }) => {
        if (listId) {
          musicInfo.meta.picUrl = url
          void updateListMusics([{ id: listId, musicInfo }])
        }
        return url
      })
    })
  } catch {
    return ''
  }
}

export const getLyricInfo = async({ musicInfo, isRefresh, skipFileLyric, onToggleSource = () => {} }: {
  musicInfo: LX.Music.MusicInfoLocal
  skipFileLyric?: boolean
  isRefresh: boolean
  onToggleSource?: (musicInfo?: LX.Music.MusicInfoOnline) => void
}): Promise<LX.Player.LyricInfo> => {
  if (!isRefresh && !skipFileLyric) {
    // 尝试读取文件内歌词
    try {
      const rawlrcInfo = await getMusicFileLyric(musicInfo.meta.filePath)
      if (rawlrcInfo) return buildLyricInfo(rawlrcInfo)
    } catch {}

    const lyricInfo = await getCachedLyricInfo(musicInfo)
    if (lyricInfo?.lyric) return buildLyricInfo(lyricInfo)
  }

  // 保持原有逻辑:尝试从网络获取
  try {
    return await getOnlineOtherSourceLyricByLocal(musicInfo, isRefresh).then(({ lyricInfo, isFromCache }) => {
      if (!isFromCache) void saveLyric(musicInfo, lyricInfo)
      return buildLyricInfo(lyricInfo)
    })
  } catch {}

  onToggleSource()
  try {
    return await getOtherSourceByLocal(musicInfo, async(otherSource) => {
      return getOnlineOtherSourceLyricInfo({ musicInfos: [...otherSource], onToggleSource, isRefresh }).then(async({ lyricInfo, musicInfo: targetMusicInfo, isFromCache }) => {
        void saveLyric(musicInfo, lyricInfo)
        if (isFromCache) return buildLyricInfo(lyricInfo)
        void saveLyric(targetMusicInfo, lyricInfo)
        return buildLyricInfo(lyricInfo)
      })
    })
  } catch {
    return buildLyricInfo({})
  }
}

const getMusicFileLyric = async(filePath: string) => {
  const lyric = await readLyric(filePath).catch(() => null)
  if (!lyric) return null
  return { lyric }
}
