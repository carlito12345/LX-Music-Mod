/**
 * GMediaHud 集成模块
 * 通过广播向 GMediaHud 发送媒体信息,实现仪表盘同步和氛围灯联动
 */
import { NativeModules } from 'react-native'

const { GMediaHudModule } = NativeModules
const isAvailable = !!GMediaHudModule

// GMediaHud 广播动作
const GMEDIAHUD_PACKAGE = 'com.salat.gmediahud'
const ACTION_SHOW = `${GMEDIAHUD_PACKAGE}.SHOW`
const ACTION_HIDE = `${GMEDIAHUD_PACKAGE}.HIDE`
const ACTION_UPDATE_AUDIO_SOURCE = `${GMEDIAHUD_PACKAGE}.UPDATE_AUDIO_SOURCE`

// 音源类型 (与 GMediaHud 的 CustomSourceType 一致)
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
  coverPath?: string
  duration?: number
  progress?: number
  sourceType?: number
}

/**
 * 发送媒体信息到 GMediaHud
 */
export async function sendMediaInfo(info: MediaInfo): Promise<boolean> {
  if (!isAvailable) {
    console.log('[GMediaHud] Module not available')
    return false
  }

  try {
    // 构建 params 字符串
    const params = [
      `source=${info.sourceType ?? SourceType.ONLINE}`,
      `progress=${info.progress ?? 0}`,
      `max_progress=${info.duration ?? 0}`,
      'queue=1',
      'warning=0',
      'pause=0',
      'toast=0',
    ].join(',')

    await GMediaHudModule.sendBroadcast(
      ACTION_SHOW,
      info.title,
      info.artist,
      info.coverPath || '',
      info.duration || 0,
      params
    )

    console.log('[GMediaHud] Media info sent:', info.title)
    return true
  } catch (e) {
    console.warn('[GMediaHud] Send failed:', String(e).substring(0, 80))
    return false
  }
}

/**
 * 隐藏 GMediaHud 显示
 */
export async function hideMediaInfo(): Promise<boolean> {
  if (!isAvailable) return false

  try {
    await GMediaHudModule.sendBroadcast(ACTION_HIDE, '', '', '', 0, '')
    console.log('[GMediaHud] Hidden')
    return true
  } catch (e) {
    console.warn('[GMediaHud] Hide failed:', String(e).substring(0, 80))
    return false
  }
}

/**
 * 更新音频源
 */
export async function updateAudioSource(source: string): Promise<boolean> {
  if (!isAvailable) return false

  try {
    await GMediaHudModule.sendBroadcast(ACTION_UPDATE_AUDIO_SOURCE, '', '', '', 0, `source=${source}`)
    console.log('[GMediaHud] Audio source updated:', source)
    return true
  } catch (e) {
    console.warn('[GMediaHud] Update source failed:', String(e).substring(0, 80))
    return false
  }
}

/**
 * 检查 GMediaHud 是否可用
 */
export function isGMediaHudAvailable(): boolean {
  return isAvailable
}

export default {
  isAvailable,
  sendMediaInfo,
  hideMediaInfo,
  updateAudioSource,
  isGMediaHudAvailable,
  SourceType,
}
