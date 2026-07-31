/**
 * MiniPlayer - 小窗播放器
 */
import { NativeModules, NativeEventEmitter } from 'react-native'
import BackgroundTimer from 'react-native-background-timer'
import { playNext, playPrev, togglePlay } from '@/core/player/player'

const { MiniPlayerModule } = NativeModules
const isAvailable = !!MiniPlayerModule

let eventEmitter: NativeEventEmitter | null = null
let isShowing = false
let pollTimer: any = null
// 设置缓存: configUpdated 事件实时更新(避免 require 读 store 为空)
let cachedMiniSettings: any = null
try {
  global.state_event?.on('configUpdated', (keys: any, setting: any) => {
    if (setting) cachedMiniSettings = { ...(cachedMiniSettings || {}), ...setting }
  })
} catch {}

const ACTION_MAP: Record<string, (data?: any) => void> = {
  next: () => playNext(),
  previous: () => playPrev(),
  playPause: () => togglePlay(),
  seek: (data) => {
    if (data?.ratio != null) {
      const { setCurrentTime } = require('@/plugins/player')
      const dur = require('@/store/player/state').default?.progress?.maxPlayTime || 0
      if (dur > 0) setCurrentTime(data.ratio * dur)
    }
  },
  like: () => {
    try {
      require('@/core/player/player').collectMusic()
      const { toast } = require('@/utils/tools')
      toast('已添加到我喜欢')
    } catch {}
  },
  changePlayMode: () => {
    try {
      const { updateSetting } = require('@/core/common')
      const { MUSIC_TOGGLE_MODE_LIST } = require('@/config/constant')
      const current = require('@/store/setting/state').default?.setting?.['player.togglePlayMethod']
      let idx = MUSIC_TOGGLE_MODE_LIST.indexOf(current)
      if (++idx >= MUSIC_TOGGLE_MODE_LIST.length) idx = 0
      const mode = MUSIC_TOGGLE_MODE_LIST[idx]
      updateSetting({ 'player.togglePlayMethod': mode })
      const names: Record<string, string> = { listLoop: '列表循环', random: '随机播放', list: '顺序播放', singleLoop: '单曲循环' }
      const { toast } = require('@/utils/tools')
      toast(names[mode] || mode)
    } catch {}
  },
}

// 应用启动时检查服务是否已在运行(开机自启场景)
// 多次重试:App 初始化时序不确定,播放器数据可能延迟就绪
function checkAndRefreshService(attempt: number = 0) {
  if (!isAvailable || attempt > 5) return
  BackgroundTimer.setTimeout(async () => {
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
  eventEmitter.addListener('onMiniPlayerAction', (data: { action: string, ratio?: number }) => {
    const handler = ACTION_MAP[data.action]
    if (handler) handler(data)
  })

  // 监听 Service 的按钮事件(常驻小窗用)
  try { MiniPlayerModule.startServiceButtonListener() } catch {}

  eventEmitter.addListener('onMiniPlayerReady', () => {
    try { NativeModules.LyricModule?.setSendLyricTextEvent?.(true) } catch {}
    pushState()
    startPoll()
    // 延迟应用样式(确保 view 已就绪)
    BackgroundTimer.setTimeout(() => {
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
          const offs = s['miniPlayer.lyricOffsetMs'] || 0
          setStyle(bg, lines, hc)
          setLyricOffset(offs)
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

const GRADIENT_PRESET_COLORS: Record<string, string> = {
  aurora: '#00e676,#00b0ff,#d500f9',
  sunset: '#ff9800,#ff1744,#d500f9',
  ocean: '#00b0ff,#1de9b6,#00e676',
  flame: '#ffea00,#ff6d00,#ff1744',
  neon: '#ea80fc,#7c4dff,#2979ff',
  candy: '#ff4081,#f48fb1,#ea80fc',
  gold: '#ffea00,#ffab00,#ff6d00',
  ice: '#80d8ff,#00b0ff,#2979ff',
}

function syncSettings() {
  try {
    // 优先用事件缓存,其次 require(双保险)
    const ss = require('@/store/setting/state').default
    if (!cachedMiniSettings && ss?.setting) cachedMiniSettings = ss.setting
    const s = cachedMiniSettings || ss?.setting
    if (!s) return
    let bg = 0xE61A1A2E
    if (s['miniPlayer.followBgColor']) {
      const sc = s['playDetail.background.solidColor'] || '#000000'
      const parsed = parseInt(sc.replace('#', ''), 16)
      if (!isNaN(parsed)) bg = (parsed & 0xFFFFFF) | 0xE6000000
    }
    const lines = s['miniPlayer.lyricLines'] || 3
    const fontSize = s['miniPlayer.lyricFontSize'] || 15
    const lineSpacing = s['miniPlayer.lyricLineSpacing'] || 6
    // 渐变优先:启用渐变时传逗号分隔色列表,否则传单色
    let hc = s['miniPlayer.lyricHighlightColor'] || '#ffffff'
    if (s['lyricGradient.enable']) {
      const custom = s['lyricGradient.customColors']
      if (custom && custom.includes(',')) {
        hc = custom
      } else {
        hc = GRADIENT_PRESET_COLORS[s['lyricGradient.preset']] || GRADIENT_PRESET_COLORS.aurora
      }
    }
    setStyle(bg, lines, hc, fontSize, lineSpacing)
    setLyricOffset(s['miniPlayer.lyricOffsetMs'] || 0)
  } catch (e) { console.warn('[MiniPlayer] syncSettings err:', e) }
}

// 双通道歌词:
// 通道1: 原生 lyric-line-play 事件(离开播放界面也工作)
// 通道2: LRC 时间戳解析(精度高,作为补充)
let lrcTimer: ReturnType<typeof setInterval> | null = null
let lrcListener: any = null
let lastLrc = ''

function parseLrc(lrcText: string): { time: number; text: string }[] {
  const lines: { time: number; text: string }[] = []
  const regex = /\[(\d+):(\d+(?:\.\d+)?)\](.*)/g
  let match
  while ((match = regex.exec(lrcText)) !== null) {
    const minutes = parseInt(match[1])
    const seconds = parseFloat(match[2])
    const text = match[3].trim()
    if (text) lines.push({ time: minutes * 60 + seconds, text })
  }
  return lines.sort((a, b) => a.time - b.time)
}

function tickLrc() {
  if (!isShowing) { stopLrcTimer(); return }
  try {
    const ps = require('@/store/player/state').default
    const mi = ps?.musicInfo
    if (!mi?.id) return
    
    const rawLrc = mi.lrc || mi.rawlrc || ''
    const nowTime = ps?.progress?.nowPlayTime || 0
    const parsed = parseLrc(rawLrc)
    
    if (parsed.length > 0) {
      let currentIdx = 0
      for (let i = parsed.length - 1; i >= 0; i--) {
        if (nowTime >= parsed[i].time) { currentIdx = i; break }
      }
      // 发送原始 LRC(带时间戳),让原生解析器自己定位 + 应用偏移
      if (rawLrc !== lastLrc) {
        lastLrc = rawLrc
        updateLrc(rawLrc)
      }
    } else if (ps?.lastLyric && ps.lastLyric !== lastLrc) {
      lastLrc = ps.lastLyric
      updateLrc(ps.lastLyric)
    }
  } catch {}
}

function startLrcEvent() {
  if (lrcTimer) return
  lastLrc = ''
  
  // 通道1: 原生歌词事件(离开界面也工作)
  try {
    const { NativeModules, NativeEventEmitter } = require('react-native')
    const LyricModule = NativeModules.LyricModule
    if (LyricModule) {
      LyricModule.setSendLyricTextEvent(true)
      const emitter = new NativeEventEmitter(LyricModule)
      lrcListener = emitter.addListener('lyric-line-play', (event: any) => {
        if (event?.text && event.text !== lastLrc) {
          lastLrc = event.text
          updateLrc(event.text)
        }
      })
    }
  } catch {}
  
  // 通道2: LRC 时间戳轮询(精度补充)
  tickLrc()
  lrcTimer = BackgroundTimer.setInterval(tickLrc, 500)
}

function stopLrcTimer() {
  if (lrcTimer) { BackgroundTimer.clearInterval(lrcTimer); lrcTimer = null }
  if (lrcListener) { try { lrcListener.remove() } catch {}; lrcListener = null }
}

function pushState() {
  syncSettings()
  try {
    const ps = require('@/store/player/state').default
    const mi = ps?.musicInfo
    if (!mi?.id) return
    updateCover(mi.pic || '')
    updatePlaybackInfo(mi.name || '', mi.singer || '', ps.isPlay, (ps?.progress?.nowPlayTime || 0) * 1000, (ps?.progress?.maxPlayTime || mi.interval || 0) * 1000)
    // 同步更新歌词(作为 setInterval 的 fallback)
    tickLrc()
  } catch {}
}

function startPoll() {
  if (pollTimer) return
  startLrcEvent()
  const loop = async () => {
    while (isShowing) {
      pushState()
      await new Promise(r => BackgroundTimer.setTimeout(r, 1000))
    }
    pollTimer = null
  }
  loop()
  pollTimer = true
}

function stopPoll() {
  pollTimer = null
  stopLrcTimer()
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
        h = ss?.setting?.['miniPlayer.customHeight'] || 900
      } catch { w = 500; h = 900 }
    }
    await MiniPlayerModule.show(w, h)
    // 等待服务窗口创建完成后推送数据
    BackgroundTimer.setTimeout(() => { pushState(); startPoll() }, 800)
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

export async function setLyricOffset(offsetMs: number): Promise<void> {
  if (!isAvailable) return
  try { await MiniPlayerModule.setLyricOffset(offsetMs) } catch {}
}

export async function setStyle(bgColor?: number, lyricLines?: number, highlightColor?: string, fontSize?: number, lineSpacing?: number): Promise<void> {
  if (!isAvailable) return
  try { await MiniPlayerModule.setStyle(bgColor || 0xE61A1A2E, lyricLines || 3, highlightColor || '#ffffff', fontSize || 15, lineSpacing || 6) } catch {}
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
