import { NativeModules, NativeEventEmitter } from 'react-native'
import playerState from '@/store/player/state'
import mediaInteraction, { SourceType } from '@/plugins/mediainteraction'
import miniplayer from '@/plugins/miniplayer'
import { playNext, playPrev, togglePlay } from '@/core/player/player'

const { CarKeyModule } = NativeModules

let initialized = false
let lastMusicId = ''
let keyEmitter: NativeEventEmitter | null = null
let keyListener: any = null
let lastProgressPush = 0

// 方控动作 → 播放器控制
function handleCarKeyAction(action: string) {
  try {
    switch (action) {
      case 'playPause': togglePlay(); break
      case 'next': playNext(); break
      case 'previous': playPrev(); break
      case 'stop': togglePlay(); break
      default: break
    }
  } catch {}
}

// 方控监听(Geely/ECarX 直连)
function startCarKeyListening() {
  try {
    if (!CarKeyModule) return
    CarKeyModule.startListening().catch(() => {})
    if (!keyEmitter) keyEmitter = new NativeEventEmitter(CarKeyModule)
    if (keyListener) { try { keyListener.remove() } catch {} }
    keyListener = keyEmitter.addListener('onCarKey', (data: any) => {
      handleCarKeyAction(data?.action || 'unknown')
    })
  } catch {}
}

export default async() => {
  // 1. 初始化 MediaInteraction 模块(可能失败,但不影响 MediaSession)
  try {
    const isAvailable = await mediaInteraction.initialize()
    if (isAvailable) {
      initialized = true
      console.log('[MediaInteraction] Initialized successfully')
    } else {
      console.log('[MediaInteraction] DimInteraction not available, MediaSession still active')
    }
  } catch (e) {
    console.warn('[MediaInteraction] init failed:', String(e).substring(0, 80))
  }

  // 2. 方控监听
  startCarKeyListening()

  const doUpdate = async(force: boolean) => {
    const musicInfo = playerState.musicInfo
    if (!musicInfo || !musicInfo.id) return

    if (!force && musicInfo.id === lastMusicId) return
    lastMusicId = musicInfo.id

    const title = musicInfo.name || ''
    const artist = musicInfo.singer || ''
    const album = musicInfo.albumName || ''
    let artworkPath = musicInfo.pic || ''
    const duration = musicInfo.interval || 0
    const isPlaying = playerState.isPlay
    const sourceType = musicInfo.source === 'local' ? SourceType.LOCAL : SourceType.ONLINE

    // 始终调用原生模块(即使 DimInteraction 不可用,MediaSession 也需要激活)
    try {
      await mediaInteraction.updateMediaInfo({ title, artist, album, artworkPath, duration, playing: isPlaying, sourceType })
    } catch (e) {
      console.warn('[MediaInteraction] update failed:', String(e).substring(0, 60))
    }
    
    if (miniplayer.isMiniPlayerShowing()) {
      try {
        await miniplayer.updateCover(artworkPath)
        await miniplayer.updatePlaybackInfo(title, artist, isPlaying, 0, duration)
      } catch {}
    }
  }

  const updateMediaInfo = () => doUpdate(false)
  const updatePlayStatus = () => doUpdate(true)

  const handleStop = async() => {
    if (!initialized) return
    lastMusicId = ''
    // 停止时清空媒体信息
    await mediaInteraction.updateMediaInfo({
      title: '',
      artist: '',
      album: '',
      artworkPath: '',
      duration: 0,
      playing: false,
      sourceType: SourceType.LOCAL,
    })
  }

  // 3. 进度推送(仪表进度条,节流 1s)
  const pushProgress = (progress: { nowPlayTime?: number } | undefined) => {
    try {
      const now = Date.now()
      if (now - lastProgressPush < 1000) return
      lastProgressPush = now
      const posMs = Math.round((progress?.nowPlayTime || 0) * 1000)
      mediaInteraction.updateProgress(posMs).catch(() => {})
    } catch {}
  }

  // 4. 监听播放器事件
  global.app_event.on('play', updatePlayStatus)
  global.app_event.on('pause', updatePlayStatus)
  global.app_event.on('musicToggled', updateMediaInfo)
  global.app_event.on('picUpdated', updateMediaInfo)
  global.app_event.on('stop', handleStop)

  // 5. 进度事件(每秒)
  try {
    global.state_event.on('playProgressChanged', pushProgress)
  } catch {}

  console.log('[MediaInteraction] Car integration ready (media + keys + progress)')
}
