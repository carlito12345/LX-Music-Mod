import initPlayer from './player'
import initPlayInfo from './playInfo'
import initPlayStatus from './playStatus'
import initPlayerEvent from './playerEvent'
import initWatchList from './watchList'
import initPlayProgress from './playProgress'
import initPreloadNextMusic from './preloadNextMusic'
import initMediaInteraction from './mediaInteraction'
import initLyric from './lyric'

export default async(setting: LX.AppSetting) => {
  await initPlayer(setting)
  await initLyric(setting)
  await initPlayInfo(setting)
  initPlayStatus()
  initPlayerEvent()
  initWatchList()
  initPlayProgress()
  initPreloadNextMusic()
  // 车机集成: 方控 + 仪表 + 音源门控(独立于小窗,播放器主体)
  initMediaInteraction()
}
