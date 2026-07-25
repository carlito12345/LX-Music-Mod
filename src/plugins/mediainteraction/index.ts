/**
 * MediaInteraction - 车机媒体交互集成
 * 直接调用车机的 IMediaInteraction API 同步媒体信息和封面
 */
import { NativeModules } from 'react-native'

const { MediaInteraction } = NativeModules
const isAvailable = !!MediaInteraction

// 音源类型
export const SourceType = {
  LOCAL: 0,
  USB: 1,
  BT: 2,
  FM: 3,
  AM: 4,
  AUX: 5,
  ONLINE: 6,
  USB2: 7,
  STATION: 8,
  NET_NEWS: 9,
  NET_VIDEO: 10,
  DAB: 11,
} as const

interface MediaInfo {
  title: string
  artist: string
  album?: string
  artworkPath?: string
  duration?: number
  playing?: boolean
  sourceType?: number
}

/**
 * 初始化媒体交互模块
 */
export async function initialize(): Promise<boolean> {
  if (!isAvailable) {
    console.log('[MediaInteraction] Module not available')
    return false
  }

  try {
    const result = await MediaInteraction.initialize()
    console.log('[MediaInteraction] Initialized:', result)
    return result
  } catch (e) {
    console.warn('[MediaInteraction] Init failed:', String(e).substring(0, 80))
    return false
  }
}

/**
 * 更新媒体信息到车机系统
 */
export async function updateMediaInfo(info: MediaInfo): Promise<boolean> {
  if (!isAvailable) return false

  try {
    const result = await MediaInteraction.updateMediaInfo(
      info.title || '',
      info.artist || '',
      info.album || '',
      info.artworkPath || '',
      info.duration || 0,
      info.playing || false,
      info.sourceType ?? SourceType.ONLINE
    )
    console.log('[MediaInteraction] Updated:', info.title)
    return result
  } catch (e) {
    console.warn('[MediaInteraction] Update failed:', String(e).substring(0, 80))
    return false
  }
}

/**
 * 更新播放进度
 */
export async function updateProgress(position: number): Promise<boolean> {
  if (!isAvailable) return false

  try {
    const result = await MediaInteraction.updateProgress(position)
    return result
  } catch (e) {
    console.warn('[MediaInteraction] Progress update failed:', String(e).substring(0, 80))
    return false
  }
}

/**
 * 释放媒体交互模块
 */
export async function release(): Promise<boolean> {
  if (!isAvailable) return false

  try {
    const result = await MediaInteraction.release()
    console.log('[MediaInteraction] Released')
    return result
  } catch (e) {
    console.warn('[MediaInteraction] Release failed:', String(e).substring(0, 80))
    return false
  }
}

/**
 * 检查模块是否可用
 */
export function isMediaInteractionAvailable(): boolean {
  return isAvailable
}

export default {
  isAvailable,
  initialize,
  updateMediaInfo,
  updateProgress,
  release,
  isMediaInteractionAvailable,
  SourceType,
}
