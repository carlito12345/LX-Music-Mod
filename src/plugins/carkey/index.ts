/**
 * CarKey - 方向盘按键监听桥接层
 * 支持:
 * 1. 原生 MEDIA_BUTTON 广播(CarKeyModule)
 * 2. 无障碍服务捕获(AccessibilityService,需手动开启)
 */
import { NativeModules, NativeEventEmitter } from 'react-native'
import { playNext, playPrev, togglePlay } from '@/core/player/player'

const { CarKeyModule } = NativeModules
let eventEmitter: NativeEventEmitter | null = null
let isListening = false

const isAvailable = !!CarKeyModule

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
    if (handler) handler()
  })
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

/** 打开系统无障碍设置页面 */
export async function openAccessibilitySettings(): Promise<boolean> {
  if (!isAvailable) return false
  try {
    await CarKeyModule.openAccessibilitySettings()
    return true
  } catch {
    return false
  }
}

/** 查询无障碍服务是否已开启 */
export async function isAccessibilityServiceRunning(): Promise<boolean> {
  if (!isAvailable) return false
  try {
    return await CarKeyModule.isServiceRunning()
  } catch {
    return false
  }
}

export default {
  startCarKeyListening, stopCarKeyListening, isCarKeyListening,
  isAvailable, openAccessibilitySettings, isAccessibilityServiceRunning,
}
