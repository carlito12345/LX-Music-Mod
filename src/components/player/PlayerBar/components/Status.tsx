import { useLrcPlay } from '@/plugins/lyric'
import { useIsPlay, useStatusText } from '@/store/player/hook'
// import { createStyle } from '@/utils/tools'
import { useBgPic } from '@/store/common/hook'
import Text from '@/components/common/Text'


export default ({ autoUpdate }: { autoUpdate: boolean }) => {
  const { text } = useLrcPlay(autoUpdate)
  const statusText = useStatusText()
  const isPlay = useIsPlay()
  // console.log('render status')

  const status = isPlay ? text : statusText
  const bgPic = useBgPic()

  return <Text numberOfLines={1} size={12} color={bgPic ? '#fff' : undefined}>{status}</Text>
}

// const styles = createStyle({
//   text: {
//     // fontSize: 10,
//     // lineHeight: 18,
//     // height: 18,
//     // height: '100%',
//     // backgroundColor: 'rgba(0,0,0,0.2)',
//   },
// })
