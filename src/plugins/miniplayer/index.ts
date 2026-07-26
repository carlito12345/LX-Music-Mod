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

  // 小窗打开时,ReactRootView 会自动从 playerState 获取最新状态
  eventEmitter.addListener('onMiniPlayerReady', () => {
    console.log('[MiniPlayer] Ready - ReactRootView auto syncs player state')
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
