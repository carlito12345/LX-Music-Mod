import playerState from '@/store/player/state'
import mediaInteraction, { SourceType } from '@/plugins/mediainteraction'
import miniplayer from '@/plugins/miniplayer'


let initialized = false
let lastMusicId = ''

export default async() => {
  // 初始化 MediaInteraction 模块(可能失败,但不影响 MediaSession)
  const isAvailable = await mediaInteraction.initialize()
  if (isAvailable) {
    initialized = true
    console.log('[MediaInteraction] Initialized successfully')
  } else {
    console.log('[MediaInteraction] DimInteraction not available, MediaSession still active')
  }

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

  // 监听播放器事件
  global.app_event.on('play', updatePlayStatus)
  global.app_event.on('pause', updatePlayStatus)
  global.app_event.on('musicToggled', updateMediaInfo)
  global.app_event.on('picUpdated', updateMediaInfo)
  global.app_event.on('stop', handleStop)

  console.log('[MediaInteraction] Event listeners registered')
}
