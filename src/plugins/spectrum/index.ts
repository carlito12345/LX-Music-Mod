/**
 * Spectrum - 音频频谱监听桥接层
 *
 * 桥接 Android Visualizer API 到 React Native
 * - start(): 开始监听频谱数据
 * - stop(): 停止监听
 * - onData: 回调接收 32 个频段的强度数据 (0-1)
 *
 * 使用:
 *   import { useSpectrum } from '@/plugins/spectrum'
 *   const spectrumData = useSpectrum()
 */
import { NativeModules, NativeEventEmitter } from 'react-native'

const { SpectrumModule } = NativeModules
let eventEmitter: NativeEventEmitter | null = null
let dataListeners: Array<(data: number[]) => void> = []
let isRunning = false
let latestData: number[] = []

// 防止模块未加载时报错
const isAvailable = !!SpectrumModule

if (isAvailable) {
  eventEmitter = new NativeEventEmitter(SpectrumModule)

  eventEmitter.addListener('onSpectrumData', (data: number[]) => {
    latestData = data
    dataListeners.forEach(cb => cb(data))
  })
}

/**
 * 开始监听频谱
 * @param audioSessionId 音频会话 ID (可选,0=自动)
 */
export async function startSpectrum(audioSessionId = 0): Promise<boolean> {
  if (!isAvailable || isRunning) return false
  try {
    const result = await SpectrumModule.startListening(audioSessionId)
    if (result) {
      isRunning = true
      console.log('[Spectrum] Started')
    }
    return result
  } catch (e) {
    console.warn('[Spectrum] Failed to start:', String(e).substring(0, 80))
    isRunning = false
    return false
  }
}

/**
 * 停止监听频谱
 */
export async function stopSpectrum(): Promise<void> {
  if (!isAvailable || !isRunning) return
  try {
    await SpectrumModule.stopListening()
    isRunning = false
    latestData = []
    console.log('[Spectrum] Stopped')
  } catch (e) {
    console.warn('[Spectrum] Failed to stop:', e)
  }
}

/**
 * 注册频谱数据回调
 */
export function onSpectrumData(cb: (data: number[]) => void): () => void {
  dataListeners.push(cb)
  return () => {
    dataListeners = dataListeners.filter(l => l !== cb)
  }
}

/**
 * 获取最新频谱数据
 */
export function getLatestData(): number[] {
  return latestData
}

/**
 * 是否正在监听
 */
export function isSpectrumRunning(): boolean {
  return isRunning
}

/**
 * 频谱 Hook
 * 返回 32 个频段的强度数组 (0-1),无数据时返回空数组
 */
export function useSpectrum(): number[] {
  // This is a simple hook that returns the latest data
  // It requires React state management - for now just return the global data
  return latestData
}

export default {
  startSpectrum,
  stopSpectrum,
  onSpectrumData,
  getLatestData,
  isSpectrumRunning,
  isAvailable,
}
