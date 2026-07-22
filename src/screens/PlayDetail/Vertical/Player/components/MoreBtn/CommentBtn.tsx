import Btn from './Btn'
import { navigations } from '@/navigation'
import commonState from '@/store/common/state'
import { getContrastTextColor } from '@/utils/colorContrast'

interface CommentBtnProps {
  backgroundColor: string
}

export default ({ backgroundColor }: CommentBtnProps) => {
  const iconColor = getContrastTextColor(backgroundColor)

  const handleShowCommentScreen = () => {
    if (commonState.componentIds.playDetail) {
      navigations.pushCommentScreen(commonState.componentIds.playDetail!)
    }
  }

  return <Btn icon="comment" onPress={handleShowCommentScreen} color={iconColor} />
}
