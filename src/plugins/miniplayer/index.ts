/**
 * MiniPlayer - 小窗播放器
 * 使用系统悬浮窗实现,可拖动,内容自适应
 */
import { NativeModules, NativeEventEmitter } from 'react-native'
import { playNext, playPrev, togglePlay } from '@/core/player/player'

const { MiniPlayerModule } = NativeModules
const isAvailable = !!MiniPlayerModule

let eventEmitter: NativeEventEmitter | null = null
let isShowing = false

const ACTION_MAP: Record<string, () => void> = {
  next: () => playNext(),
  previous: () => playPrev(),
  playPause: () => togglePlay(),
}

if (isAvailable) {
  eventEmitter = new NativeEventEmitter(MiniPlayerModule)
  eventEmitter.addListener('onMiniPlayerAction', (data: { action: string }) => {
    const handler = ACTION_MAP[data.action]
    if (handler) handler()
  })
}

/**
 * 显示小窗播放器
 */
export async function show(): Promise<boolean> {
  if (!isAvailable || isShowing) return false
  try {
    await MiniPlayerModule.show()
    isShowing = true
    return true
  } catch {
    return false
  }
}

/**
 * 隐藏小窗播放器
 */
export async function hide(): Promise<boolean> {
  if (!isAvailable || !isShowing) return false
  try {
    await MiniPlayerModule.hide()
    isShowing = false
    return true
  } catch {
    return false
  }
}

/**
 * 更新封面
 */
export async function updateCover(coverPath: string): Promise<void> {
  if (!isAvailable || !isShowing) return
  try {
    await MiniPlayerModule.updateCover(coverPath)
  } catch {}
}

/**
 * 更新播放信息(标题、歌手、播放状态、进度)
 */
export async function updatePlaybackInfo(
  title: string,
  artist: string,
  playing: boolean,
  progress?: number,
  maxProgress?: number
): Promise<void> {
  if (!isAvailable || !isShowing) return
  try {
    await MiniPlayerModule.updatePlaybackInfo(
      title || '',
      artist || '',
      playing,
      progress || 0,
      maxProgress || 100
    )
  } catch {}
}

export function isMiniPlayerShowing(): boolean {
  return isShowing
}

export async function hasOverlayPermission(): Promise<boolean> {
  if (!isAvailable) return false
  try { return await MiniPlayerModule.hasOverlayPermission() } catch { return false }
}

export async function openOverlaySettings(): Promise<boolean> {
  if (!isAvailable) return false
  try { await MiniPlayerModule.openOverlaySettings(); return true } catch { return false }
}

export default {
  isAvailable,
  show,
  hide,
  updateCover,
  updatePlaybackInfo,
  isMiniPlayerShowing,
  hasOverlayPermission,
  openOverlaySettings,
}
