import { View } from 'react-native'
import { useStatusText } from '@/store/player/hook'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { getSecondaryTextColor } from '@/utils/colorContrast'
import LottieLoading from '@/components/common/LottieLoading'

interface StatusProps {
  backgroundColor: string
}

// 需要显示加载动画的状态关键词
const LOADING_KEYWORDS = ['缓冲', '加载', 'Buffer', 'Loading', '获取']

export default ({ backgroundColor }: StatusProps) => {
  const statusText = useStatusText()
  const textColor = getSecondaryTextColor(backgroundColor)
  const isLoading = LOADING_KEYWORDS.some(k => statusText?.includes(k))

  return (
    <View style={styles.row}>
      {isLoading ? <LottieLoading size={20} style={styles.lottie} /> : null}
      <Text style={styles.text} numberOfLines={1} size={13} color={textColor}>{statusText}</Text>
    </View>
  )
}

const styles = createStyle({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottie: {
    marginRight: 4,
  },
  text: {
    textAlign: 'center',
  },
})
