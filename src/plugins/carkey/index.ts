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
    console.log('[CarKey] Event:', data)
    const handler = ACTION_MAP[data.action]
    if (handler) handler()
  })
}

export async function startCarKeyListening(): Promise<boolean> {
  if (!isAvailable) {
    console.warn('[CarKey] Module not available')
    return false
  }
  if (isListening) {
    console.log('[CarKey] Already listening')
    return true
  }
  try {
    await CarKeyModule.startListening()
    isListening = true
    console.log('[CarKey] Started successfully')
    return true
  } catch (e: any) {
    console.warn('[CarKey] Failed:', e?.message || String(e))
    throw e
  }
}

export async function stopCarKeyListening(): Promise<void> {
  if (!isAvailable || !isListening) return
  try {
    await CarKeyModule.stopListening()
    isListening = false
  } catch (e) {
    console.warn('[CarKey] Stop failed:', String(e))
  }
}

export function isCarKeyListening(): boolean { return isListening }

export async function openAccessibilitySettings(): Promise<boolean> {
  if (!isAvailable) return false
  try {
    await CarKeyModule.openAccessibilitySettings()
    return true
  } catch { return false }
}

export async function isAccessibilityServiceRunning(): Promise<boolean> {
  if (!isAvailable) return false
  try { return await CarKeyModule.isServiceRunning() } catch { return false }
}

export async function isGeelyConnected(): Promise<boolean> {
  if (!isAvailable) return false
  try { return await CarKeyModule.isGeelyConnected() } catch { return false }
}

export default {
  startCarKeyListening, stopCarKeyListening, isCarKeyListening,
  isAvailable, openAccessibilitySettings, isAccessibilityServiceRunning, isGeelyConnected,
}
