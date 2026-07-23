/**
 * USB - USB设备检测桥接层
 * 检测USB存储设备插入,自动扫描音频文件
 */
import { NativeModules, NativeEventEmitter } from 'react-native'
import { scanAudioFiles } from '@/utils/localMediaMetadata'
import { setTempList } from '@/core/list'
import { toast } from '@/utils/tools'

const { USBModule } = NativeModules
let eventEmitter: NativeEventEmitter | null = null
let isListening = false
let onFilesFound: ((files: {name: string; path: string}[]) => void) | null = null

const isAvailable = !!USBModule

if (isAvailable) {
  eventEmitter = new NativeEventEmitter(USBModule)

  eventEmitter.addListener('onUSBMounted', (data: { action: string; path: string }) => {
    console.log('[USB] Mounted:', data.path)
    toast(`检测到USB设备: ${data.path}`)
    // 自动扫描USB设备中的音频文件
    scanUSBFiles(data.path)
  })

  eventEmitter.addListener('onUSBUnmounted', (data: { action: string; path: string }) => {
    console.log('[USB] Removed:', data.path)
    toast('USB设备已移除')
  })
}

const scanUSBFiles = async (path: string) => {
  try {
    const files = await scanAudioFiles(path, true)
    if (files.length === 0) return
    const musicList = files.map(f => ({
      id: f.path,
      name: f.name.replace(/\.[^/.]+$/, ''),
      singer: 'USB设备',
      source: 'local' as const,
      quality: 'unknown',
      interval: null,
      meta: { filePath: f.path, ext: f.name.includes('.') ? f.name.split('.').pop() || '' : '' },
    }))
    await setTempList('usb_queue', musicList as any)
    toast(`USB设备: 已加载 ${musicList.length} 首歌曲`)
    if (onFilesFound) onFilesFound(files)
  } catch (e) {
    console.warn('[USB] Scan error:', e)
  }
}

export async function startUSBListening(callback?: (files: {name: string; path: string}[]) => void): Promise<boolean> {
  if (!isAvailable || isListening) return false
  try {
    await USBModule.startListening()
    isListening = true
    if (callback) onFilesFound = callback
    console.log('[USB] Started')
    return true
  } catch (e) {
    console.warn('[USB] Failed:', String(e).substring(0, 80))
    return false
  }
}

export async function stopUSBListening(): Promise<void> {
  if (!isAvailable || !isListening) return
  try {
    await USBModule.stopListening()
    isListening = false
    console.log('[USB] Stopped')
  } catch (e) {
    console.warn('[USB] Failed to stop:', String(e).substring(0, 80))
  }
}

export async function getExternalPaths(): Promise<string[]> {
  if (!isAvailable) return []
  try {
    return await USBModule.getExternalStoragePaths()
  } catch {
    return []
  }
}

export default { startUSBListening, stopUSBListening, isAvailable, getExternalPaths }
