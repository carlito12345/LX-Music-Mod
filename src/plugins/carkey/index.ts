/**
 * CarKey - 方向盘按键监听桥接层
 * 连接 Android 车载按键到 LX Music 播放控制
 *
 * 支持按键:
 * - 上一曲 / 下一曲
 * - 播放 / 暂停
 * - 音量控制
 * - 快进 / 快退
 */
import { NativeModules, NativeEventEmitter } from 'react-native'
import { playNext, playPrev, togglePlay } from '@/core/player/player'

const { CarKeyModule } = NativeModules
let eventEmitter: NativeEventEmitter | null = null
let isListening = false

const isAvailable = !!CarKeyModule

// 按键到播放操作的映射
const ACTION_MAP: Record<string, () => void> = {
  next: () => playNext(),
  previous: () => playPrev(),
  playPause: () => togglePlay(),
  stop: () => togglePlay(),
}

if (isAvailable) {
  eventEmitter = new NativeEventEmitter(CarKeyModule)

  eventEmitter.addListener('onCarKey', (data: { keyCode: number; action: string }) => {
    const handler = ACTION_MAP[data.action]
    if (handler) {
      handler()
    }
  })
}

/**
 * 开始监听方向盘按键
 */
export async function startCarKeyListening(): Promise<boolean> {
  if (!isAvailable || isListening) return false
  try {
    await CarKeyModule.startListening()
    isListening = true
    console.log('[CarKey] Started')
    return true
  } catch (e) {
    console.warn('[CarKey] Failed:', String(e).substring(0, 80))
    return false
  }
}

/**
 * 停止监听方向盘按键
 */
export async function stopCarKeyListening(): Promise<void> {
  if (!isAvailable || !isListening) return
  try {
    await CarKeyModule.stopListening()
    isListening = false
    console.log('[CarKey] Stopped')
  } catch (e) {
    console.warn('[CarKey] Failed to stop:', String(e).substring(0, 80))
  }
}

/**
 * 是否正在监听
 */
export function isCarKeyListening(): boolean {
  return isListening
}

export default {
  startCarKeyListening,
  stopCarKeyListening,
  isCarKeyListening,
  isAvailable,
}
