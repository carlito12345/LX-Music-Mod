import { memo } from 'react'
import { View } from 'react-native'

import Progress from '@/components/player/ProgressBar'
import Status from './Status'
import { useProgress } from '@/store/player/hook'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { useBufferProgress } from '@/plugins/player'
import { getContrastTextColor } from '@/utils/colorContrast'

interface PlayInfoProps {
  backgroundColor: string
}

const PlayTimeCurrent = ({ timeStr, color }: { timeStr: string; color: string }) => {
  return <Text color={color}>{timeStr}</Text>
}

const PlayTimeMax = memo(({ timeStr, color }: { timeStr: string; color: string }) => {
  return <Text color={color}>{timeStr}</Text>
})

export default memo(({ backgroundColor }: PlayInfoProps) => {
  const { maxPlayTimeStr, nowPlayTimeStr, progress, maxPlayTime } = useProgress()
  const buffered = useBufferProgress()
  const textColor = getContrastTextColor(backgroundColor)

  return (
    <>
      <View style={styles.progress}><Progress progress={progress} duration={maxPlayTime} buffered={buffered} backgroundColor={backgroundColor} /></View>
      <View style={styles.info}>
        <PlayTimeCurrent timeStr={nowPlayTimeStr} color={textColor} />
        <View style={styles.status} >
          <Status backgroundColor={backgroundColor} />
        </View>
        <PlayTimeMax timeStr={maxPlayTimeStr} color={textColor} />
      </View>
    </>
  )
})


const styles = createStyle({
  progress: {
    flexGrow: 1,
    flexShrink: 0,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  info: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  status: {
    flexGrow: 1,
    flexShrink: 1,
    paddingLeft: 10,
    paddingRight: 10,
  },
})
