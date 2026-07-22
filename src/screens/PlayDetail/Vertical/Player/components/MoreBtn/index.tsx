import { createStyle } from '@/utils/tools'
import { View } from 'react-native'
import PlayModeBtn from './PlayModeBtn'
import MusicAddBtn from './MusicAddBtn'
import DesktopLyricBtn from './DesktopLyricBtn'
import CommentBtn from './CommentBtn'

interface MoreBtnProps {
  backgroundColor: string
}

export default ({ backgroundColor }: MoreBtnProps) => {
  return (
    <View style={styles.container}>
      <DesktopLyricBtn backgroundColor={backgroundColor} />
      <MusicAddBtn backgroundColor={backgroundColor} />
      <PlayModeBtn backgroundColor={backgroundColor} />
      <CommentBtn backgroundColor={backgroundColor} />
    </View>
  )
}


const styles = createStyle({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
})
