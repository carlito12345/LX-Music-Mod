/**
 * CarKey - 方向盘按键监听桥接层
 * 支持:
 * 1. 原生 MEDIA_BUTTON 广播(CarKeyModule)
 * 2. GIB 广播监听 (com.salat.gbinder.*)
 */
import { NativeModules, NativeEventEmitter, DeviceEventEmitter } from 'react-native'
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
  volumeUp: () => {},
  volumeDown: () => {},
  volumeMute: () => {},
}

// GIB 广播动作映射
const GIB_ACTIONS: Record<string, string> = {
  'com.salat.gbinder.TOGGLE_LAUNCHER': 'toggle',
  'com.salat.gbinder.SHORT_CLICK': 'playPause',
  'com.salat.gbinder.LONG_PRESS': 'previous',
  'com.salat.gbinder.DOUBLE_CLICK': 'next',
  'com.salat.gbinder.SET_AUDIO_SOURCE': 'toggle',
  'com.salat.gbinder.ENABLE_MEDIA_CONTROL': 'playPause',
  'com.salat.gbinder.DISABLE_MEDIA_CONTROL': 'stop',
  'com.salat.gbinder.PHONE_CALL': 'toggle',
  'com.salat.gbinder.ANSWER_CALL': 'toggle',
  'com.salat.gbinder.REJECT_CALL': 'toggle',
  'com.salat.gbinder.TOGGLE_CAMERA': 'toggle',
}

if (isAvailable) {
  eventEmitter = new NativeEventEmitter(CarKeyModule)
  eventEmitter.addListener('onCarKey', (data: { keyCode: number; action: string }) => {
    const handler = ACTION_MAP[data.action]
    if (handler) handler()
  })
}

// 监听 GIB 广播
const handleGIBIntent = (action: string) => {
  const mapped = GIB_ACTIONS[action]
  if (mapped && ACTION_MAP[mapped]) {
    ACTION_MAP[mapped]()
  }
}

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

export function isCarKeyListening(): boolean {
  return isListening
}

export { handleGIBIntent }

export default { startCarKeyListening, stopCarKeyListening, isCarKeyListening, isAvailable, handleGIBIntent }
