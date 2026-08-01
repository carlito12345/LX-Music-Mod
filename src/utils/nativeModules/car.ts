/**
 * 车机集成封装 (Car Integration)
 * 统一入口: 音源门控 + 方控 + 仪表展示
 * 原生模块: CarKeyModule / MediaInteraction / GMediaHud
 */
import { NativeModules, NativeEventEmitter } from 'react-native'

const { CarKeyModule, MediaInteraction, GMediaHud } = NativeModules

let keyEmitter: NativeEventEmitter | null = null
let keyListener: any = null
let carKeyHandler: ((action: string, data?: any) => void) | null = null

/** 初始化车机集成(方控监听 + 仪表交互) */
export const carInit = async (): Promise<void> => {
  try { await MediaInteraction?.initialize() } catch {}
  try { await CarKeyModule?.startListening() } catch {}
}

/** 释放车机集成 */
export const carRelease = async (): Promise<void> => {
  try { await CarKeyModule?.stopListening() } catch {}
  if (keyListener) { try { keyListener.remove() } catch {}; keyListener = null }
}

/**
 * 推送媒体信息到仪表 (播放歌曲/状态变化时调用)
 * sourceType: 6 = SOURCE_TYPE_ONLINE
 */
export const carUpdateMediaInfo = async (info: {
  title?: string
  artist?: string
  album?: string
  pic?: string
  duration?: number   // 秒
  isPlay?: boolean
}): Promise<void> => {
  try {
    await MediaInteraction?.updateMediaInfo(
      info?.title || '',
      info?.artist || '',
      info?.album || '',
      info?.pic || '',
      Math.round((info?.duration || 0) * 1000), // 秒→毫秒
      !!info?.isPlay,
      6, // SOURCE_TYPE_ONLINE
    )
  } catch {}
}

/** 推送播放进度 (毫秒) */
export const carUpdateProgress = async (positionMs: number): Promise<void> => {
  try {
    await MediaInteraction?.updateProgress(Math.max(0, Math.round(positionMs)))
  } catch {}
}

/** 注册方控事件 (onCarKey: action = playPause/next/previous/volumeUp/...) */
export const onCarKeyEvent = (handler: (action: string, data?: any) => void): void => {
  carKeyHandler = handler
  if (!CarKeyModule) return
  try {
    if (!keyEmitter) keyEmitter = new NativeEventEmitter(CarKeyModule)
    if (keyListener) { try { keyListener.remove() } catch {} }
    keyListener = keyEmitter.addListener('onCarKey', (data: any) => {
      const action = data?.action || 'unknown'
      try { carKeyHandler?.(action, data) } catch {}
    })
  } catch {}
}

/** 发送 GMediaHud 仪表广播 */
export const carSendHudBroadcast = async (
  action: string,
  title: string,
  subtitle: string,
  art: string,
  duration: number,
  params: string,
): Promise<void> => {
  try {
    await GMediaHud?.sendBroadcast(action, title, subtitle, art, Math.round(duration), params)
  } catch {}
}
