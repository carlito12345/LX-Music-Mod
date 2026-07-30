/**
 * MusicFreePlayer - MusicFree 风格播放控件
 * MoreBtn → PlayInfo(进度条) → ControlBtn
 */
import { memo } from 'react'
import { View, StyleSheet } from 'react-native'
import MoreBtn from '../Player/components/MoreBtn'
import PlayInfo from '../Player/components/PlayInfo'
import ControlBtn from '../Player/components/ControlBtn'

interface Props {
  backgroundColor: string
}

export default memo(({ backgroundColor }: Props) => {
  return (
    <View style={styles.container}>
      <MoreBtn backgroundColor={backgroundColor} />
      <PlayInfo backgroundColor={backgroundColor} />
      <ControlBtn backgroundColor={backgroundColor} />
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 15,
    paddingBottom: 8,
  },
})
