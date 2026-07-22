import { useStatusText } from '@/store/player/hook'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { getSecondaryTextColor } from '@/utils/colorContrast'

interface StatusProps {
  backgroundColor: string
}

export default ({ backgroundColor }: StatusProps) => {
  const statusText = useStatusText()
  const textColor = getSecondaryTextColor(backgroundColor)

  return <Text style={styles.text} numberOfLines={1} size={13} color={textColor}>{statusText}</Text>
}

const styles = createStyle({
  text: {
    textAlign: 'center',
  },
})
