/**
 * MiniPlayer - 小窗播放器
 */
import { NativeModules, NativeEventEmitter } from 'react-native'
import { playNext, playPrev, togglePlay } from '@/core/player/player'

const { MiniPlayerModule } = NativeModules
const isAvailable = !!MiniPlayerModule

let eventEmitter: NativeEventEmitter | null = null
let isShowing = false
let pollTimer: any = null

const ACTION_MAP: Record<string, () => void> = {
  next: () => playNext(),
  previous: () => playPrev(),
  playPause: () => togglePlay(),
}

// 应用启动时检查服务是否已在运行(开机自启场景)
// 多次重试:App 初始化时序不确定,播放器数据可能延迟就绪
function checkAndRefreshService(attempt: number = 0) {
  if (!isAvailable || attempt > 5) return
  setTimeout(async () => {
    try {
      const running = await MiniPlayerModule.isServiceRunning()
      console.log(`[MiniPlayer] 开机检查#${attempt} 服务运行:`, running)
      if (running) {
        isShowing = true
        pushState()
        startPoll()
      } else if (attempt < 5) {
        checkAndRefreshService(attempt + 1)
      }
    } catch (e) {
      if (attempt < 5) checkAndRefreshService(attempt + 1)
    }
  }, 2000 + attempt * 2000)
}
try { checkAndRefreshService() } catch {}

if (isAvailable) {
  eventEmitter = new NativeEventEmitter(MiniPlayerModule)
  eventEmitter.addListener('onMiniPlayerAction', (data: { action: string }) => {
    const handler = ACTION_MAP[data.action]
    if (handler) handler()
  })

  // 监听 Service 的按钮事件(常驻小窗用)
  try { MiniPlayerModule.startServiceButtonListener() } catch {}

  eventEmitter.addListener('onMiniPlayerReady', () => {
    try { NativeModules.LyricModule?.setSendLyricTextEvent?.(true) } catch {}
    pushState()
    startPoll()
    // 延迟应用样式(确保 view 已就绪)
    setTimeout(() => {
      try {
        const ss = require('@/store/setting/state').default
        const s = ss?.setting
        if (s) {
          let bg = 0xE61A1A2E
          if (s['miniPlayer.followBgColor']) {
            const sc = s['playDetail.background.solidColor'] || '#000000'
            bg = parseInt(sc.replace('#', ''), 16)
            if (isNaN(bg)) bg = 0x000000
            bg = (bg & 0xFFFFFF) | 0xE6000000
          }
          const lines = s['miniPlayer.lyricLines'] || 3
          const hc = s['miniPlayer.lyricHighlightColor'] || '#ffffff'
          setStyle(bg, lines, hc)
        }
      } catch (e) { console.warn('[MiniPlayer] style error:', e) }
    }, 200)
  })

  eventEmitter.addListener('onMiniPlayerSeek', (data: { ratio: number }) => {
    if (data?.ratio != null) {
      const { seek } = require('@/core/player/player')
      seek(data.ratio)
    }
  })
}

function syncSettings() {
  try {
    const ss = require('@/store/setting/state').default
    const s = ss?.setting
    if (!s) return
    let bg = 0xE61A1A2E
    if (s['miniPlayer.followBgColor']) {
      const sc = s['playDetail.background.solidColor'] || '#000000'
      const parsed = parseInt(sc.replace('#', ''), 16)
      if (!isNaN(parsed)) bg = (parsed & 0xFFFFFF) | 0xE6000000
    }
    const lines = s['miniPlayer.lyricLines'] || 3
    const hc = s['miniPlayer.lyricHighlightColor'] || '#ffffff'
    setStyle(bg, lines, hc)
  } catch (e) { console.warn('[MiniPlayer] syncSettings err:', e) }
}

function pushState() {
  syncSettings()
  try {
    const ps = require('@/store/player/state').default
    const mi = ps?.musicInfo
    if (!mi?.id) return
    updateCover(mi.pic || '')
    updatePlaybackInfo(mi.name || '', mi.singer || '', ps.isPlay, 0, mi.interval || 0)
    // 读取多行歌词(当前行 ± 2 行)
    let lrcText = ps?.lastLyric || ''
    try {
      const lyric = require('@/plugins/lyric')
      const currentLine = lyric.getCurrentLrcLine?.()
      if (currentLine?.text) lrcText = currentLine.text
      // 尝试获取前后歌词行
      const allLines = lyric.getLines?.()
      const lineIdx = currentLine?.line
      if (allLines?.length && typeof lineIdx === 'number') {
        const start = Math.max(0, lineIdx - 1)
        const end = Math.min(allLines.length, lineIdx + 4)
        const lines = allLines.slice(start, end).map((l: any) => l.text || '')
        if (lines.length >= 3) lrcText = lines.join('\n')
      }
    } catch {}
    if (lrcText) updateLrc(lrcText)
  } catch {}
}

function startPoll() {
  if (pollTimer) return
  const loop = async () => {
    while (isShowing) {
      pushState()
      await new Promise(r => setTimeout(r, 1000))
    }
    pollTimer = null
  }
  loop()
  pollTimer = true
}

function stopPoll() {
  pollTimer = null
}

export async function show(width?: number, height?: number): Promise<boolean> {
  if (!isAvailable) return false
  try {
    const running = await MiniPlayerModule.isServiceRunning()
    if (running) {
      // 服务已在运行 → 刷新数据(不创建新窗口)
      console.log('[MiniPlayer] 服务已运行,刷新数据')
      isShowing = true
      pushState()
      startPoll()
      return true
    }
    // 服务未运行 → 启动新服务
    console.log('[MiniPlayer] 启动新服务')
    isShowing = true
    let w = width, h = height
    if (!w || !h) {
      try {
        const ss = require('@/store/setting/state').default
        w = ss?.setting?.['miniPlayer.customWidth'] || 500
        h = ss?.setting?.['miniPlayer.customHeight'] || 800
      } catch { w = 500; h = 800 }
    }
    await MiniPlayerModule.show(w, h)
    // 等待服务窗口创建完成后推送数据
    setTimeout(() => { pushState(); startPoll() }, 800)
    return true
  } catch (e) { console.warn('[MiniPlayer] show err:', e); isShowing = false; return false }
}

export async function hide(): Promise<boolean> {
  if (!isAvailable) return false
  stopPoll()
  isShowing = false
  try {
    await MiniPlayerModule.hide()
    return true
  } catch { return false }
}

export async function updateCover(coverPath: string): Promise<void> {
  if (!isAvailable) return
  try { await MiniPlayerModule.updateCover(coverPath) } catch {}
}

export async function updatePlaybackInfo(
  title: string, artist: string, playing: boolean, progress?: number, maxProgress?: number
): Promise<void> {
  if (!isAvailable) return
  try { await MiniPlayerModule.updatePlaybackInfo(title || '', artist || '', playing, progress || 0, maxProgress || 100) } catch {}
}

export async function setStyle(bgColor?: number, lyricLines?: number, highlightColor?: string): Promise<void> {
  if (!isAvailable) return
  try { await MiniPlayerModule.setStyle(bgColor || 0xE61A1A2E, lyricLines || 3, highlightColor || '#ffffff') } catch {}
}

export async function updateLrc(text: string): Promise<void> {
  if (!isAvailable) return
  try { await MiniPlayerModule.updateLrc(text || '') } catch {}
}

export function isMiniPlayerShowing(): boolean { return isShowing }

export async function isServiceRunning(): Promise<boolean> {
  if (!isAvailable) return false
  try { return await MiniPlayerModule.isServiceRunning() } catch { return false }
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
  isAvailable, show, hide, setStyle, updateCover, updatePlaybackInfo, updateLrc,
  isMiniPlayerShowing, isServiceRunning, hasOverlayPermission, openOverlaySettings,
}
