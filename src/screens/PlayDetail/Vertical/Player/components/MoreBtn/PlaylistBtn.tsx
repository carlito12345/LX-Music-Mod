import Btn from './Btn'
import { getContrastTextColor } from '@/utils/colorContrast'
import commonState from '@/store/common/state'
import { navigations } from '@/navigation'

interface PlaylistBtnProps {
  backgroundColor: string
}

export default ({ backgroundColor }: PlaylistBtnProps) => {
  const iconColor = getContrastTextColor(backgroundColor)

  const handleOpenPlaylist = () => {
    const playDetailId = commonState.componentIds.playDetail
    if (playDetailId) {
      navigations.pushPlayQueueScreen(playDetailId)
    }
  }

  return <Btn icon="menu" onPress={handleOpenPlaylist} color={iconColor} />
}
