import playerState from '@/store/player/state'
import mediaInteraction, { SourceType } from '@/plugins/mediainteraction'

let initialized = false
let lastMusicId = ''

export default async() => {
  // 初始化 MediaInteraction 模块
  const isAvailable = await mediaInteraction.initialize()
  if (!isAvailable) {
    console.log('[MediaInteraction] Not available on this device')
    return
  }
  initialized = true
  console.log('[MediaInteraction] Initialized successfully')

  const updateMediaInfo = async() => {
    if (!initialized) return

    const musicInfo = playerState.musicInfo
    if (!musicInfo || !musicInfo.id) return

    // 避免重复更新同一首歌
    if (musicInfo.id === lastMusicId) return
    lastMusicId = musicInfo.id

    const title = musicInfo.name || ''
    const artist = musicInfo.singer || ''
    const album = musicInfo.albumName || ''
    const artworkPath = musicInfo.pic || ''
    const duration = musicInfo.interval || 0
    const isPlaying = playerState.isPlay

    // 根据音乐来源确定 sourceType
    const sourceType = musicInfo.source === 'local' ? SourceType.LOCAL : SourceType.ONLINE

    await mediaInteraction.updateMediaInfo({
      title,
      artist,
      album,
      artworkPath,
      duration,
      playing: isPlaying,
      sourceType,
    })
  }

  const updatePlayStatus = async() => {
    if (!initialized) return

    const musicInfo = playerState.musicInfo
    if (!musicInfo || !musicInfo.id) return

    const title = musicInfo.name || ''
    const artist = musicInfo.singer || ''
    const album = musicInfo.albumName || ''
    const artworkPath = musicInfo.pic || ''
    const duration = musicInfo.interval || 0
    const isPlaying = playerState.isPlay
    const sourceType = musicInfo.source === 'local' ? SourceType.LOCAL : SourceType.ONLINE

    await mediaInteraction.updateMediaInfo({
      title,
      artist,
      album,
      artworkPath,
      duration,
      playing: isPlaying,
      sourceType,
    })
  }

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
