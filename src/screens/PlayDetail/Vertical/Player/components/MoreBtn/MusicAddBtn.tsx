import { useRef } from 'react'
import MusicAddModal, { type MusicAddModalType } from '@/components/MusicAddModal'
import playerState from '@/store/player/state'
import Btn from './Btn'
import { getContrastTextColor } from '@/utils/colorContrast'

interface MusicAddBtnProps {
  backgroundColor: string
}

export default ({ backgroundColor }: MusicAddBtnProps) => {
  const musicAddModalRef = useRef<MusicAddModalType>(null)
  const iconColor = getContrastTextColor(backgroundColor)

  const handleShowMusicAddModal = () => {
    const musicInfo = playerState.playMusicInfo.musicInfo
    if (!musicInfo) return
    musicAddModalRef.current?.show({
      musicInfo: 'progress' in musicInfo ? musicInfo.metadata.musicInfo : musicInfo,
      isMove: false,
      listId: playerState.playMusicInfo.listId!,
    })
  }

  return (
    <>
      <Btn icon="add-music" onPress={handleShowMusicAddModal} color={iconColor} />
      <MusicAddModal ref={musicAddModalRef} />
    </>
  )
}
