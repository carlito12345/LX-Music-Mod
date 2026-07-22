import { temporaryDirectoryPath, readDir, unlink, extname } from '@/utils/fs'
import { readPic as _readPic } from 'react-native-local-media-metadata'
export {
  type MusicMetadata,
  type MusicMetadataFull,
  readMetadata,
  writeMetadata,
  writePic,
  readLyric,
  writeLyric,
} from 'react-native-local-media-metadata'

let cleared = false
const picCachePath = temporaryDirectoryPath + '/local-media-metadata'

export const scanAudioFiles = async(dirPath: string, recursive = true): Promise<{name: string; path: string}[]> => {
  const allFiles: {name: string; path: string}[] = []
  const AUDIO_EXTS = ['.mp3', '.flac', '.ogg', '.wav', '.aac', '.m4a', '.wma', '.ape']

  const scanDir = async(currentPath: string) => {
    try {
      const entries = await readDir(currentPath) // FileType[]
      for (const entry of entries) {
        if (entry.isDirectory && recursive) {
          await scanDir(entry.path)
        } else if (entry.isFile) {
          const ext = extname(entry.name).toLowerCase()
          if (AUDIO_EXTS.includes(`.${ext}`)) {
            allFiles.push({ name: entry.name, path: entry.path })
          }
        }
      }
    } catch { }
  }

  await scanDir(dirPath)
  return allFiles
}

const clearPicCache = async() => {
  await unlink(picCachePath)
  cleared = true
}

export const readPic = async(dirPath: string): Promise<string> => {
  if (!cleared) await clearPicCache()
  return _readPic(dirPath, picCachePath)
}

// export interface MusicMetadata {
//   type: 'mp3' | 'flac' | 'ogg' | 'wav'
//   bitrate: string
//   interval: number
//   size: number
//   ext: 'mp3' | 'flac' | 'ogg' | 'wav'
//   albumName: string
//   singer: string
//   name: string
// }
// export const readMetadata = async(filePath: string): Promise<MusicMetadata | null> => {
//   return LocalMediaModule.readMetadata(filePath)
// }

// export const readPic = async(filePath: string): Promise<string> => {
//   return LocalMediaModule.readPic(filePath)
// }

// export const readLyric = async(filePath: string): Promise<string> => {
//   return LocalMediaModule.readLyric(filePath)
// }


