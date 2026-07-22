import { memo } from 'react'
import { View } from 'react-native'

// import Title from './components/Title'
import MoreBtn from './components/MoreBtn'
import PlayInfo from './components/PlayInfo'
import ControlBtn from './components/ControlBtn'
import { createStyle } from '@/utils/tools'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'

interface PlayerProps {
  backgroundColor: string
}

export default memo(({ backgroundColor }: PlayerProps) => {
  return (
    <View style={styles.container} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_player}>
      <PlayInfo backgroundColor={backgroundColor} />
      <ControlBtn backgroundColor={backgroundColor} />
      <MoreBtn backgroundColor={backgroundColor} />
    </View>
  )
})

const styles = createStyle({
  container: {
    flex: 0,
    width: '100%',
    paddingHorizontal: 15,
    paddingBottom: 15,
    paddingTop: 5,
    flexDirection: 'column',
  },
  status: {
    marginTop: 10,
    flexDirection: 'column',
    flex: 0,
    paddingLeft: 5,
    justifyContent: 'space-evenly',
  },
})
