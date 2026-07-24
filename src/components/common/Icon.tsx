import { memo, type ComponentProps } from 'react'
import { StyleSheet, type StyleProp, type TextStyle } from 'react-native'
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import { scaleSizeW } from '@/utils/pixelRatio'
import { useTextShadow, useTheme } from '@/store/theme/hook'

// 旧 IcoMoon 图标名 → MaterialCommunityIcons 图标名映射
const ICON_MAP: Record<string, string> = {
  'chevron-left': 'chevron-left',
  'chevron-right': 'chevron-right',
  'chevron-left-2': 'chevron-left',
  'chevron-right-2': 'chevron-right',
  'back-2': 'arrow-left',
  'close': 'close',
  'remove': 'close-circle-outline',
  'menu': 'menu',
  'home': 'home',
  'pause': 'pause',
  'play': 'play',
  'play-outline': 'play-circle-outline',
  'nextMusic': 'skip-next',
  'prevMusic': 'skip-previous',
  'skip-next': 'skip-next',
  'skip-previous': 'skip-previous',
  'setting': 'cog',
  'download-2': 'download',
  'love': 'heart',
  'leaderboard': 'trophy',
  'album': 'album',
  'search-2': 'magnify',
  'share': 'share-variant',
  'dots-vertical': 'dots-vertical',
  'thumbs-up': 'thumb-up',
  'add_folder': 'folder-plus',
  'add-music': 'music-box-plus',
  'comment': 'comment-text-outline',
  'playlist': 'playlist-music',
  'eraser': 'eraser',
  'music_time': 'clock-music',
  'available_updates': 'cellphone-arrow-down',
  'sd-card': 'sd',
  'help': 'help-circle',
  'volume-mute': 'volume-mute',
  'volume-off': 'volume-off',
  'volume-low': 'volume-low',
  'volume-medium': 'volume-medium',
  'volume-higt': 'volume-high',
  'list-loop': 'repeat',
  'list-random': 'shuffle',
  'list-order': 'order-bool-ascending',
  'single-loop': 'repeat-once',
  'single': 'repeat-off',
  'full_stop': 'circle-medium',
  'checkbox-blank-outline': 'checkbox-blank-outline',
  'checkbox-marked': 'checkbox-marked',
  'minus-box': 'minus-box',
  'slider': 'tune',
  'lyric-off': 'subtitles-outline',
  'lyric-on': 'subtitles',
  'playback-rate': 'play-speed',
  'exit': 'exit-run',
  'exit2': 'exit-to-app',
  'logo': 'music',
}

export interface IconProps extends Omit<ComponentProps<typeof MCIcon>, 'style'> {
  style?: StyleProp<TextStyle>
  rawSize?: number
  name: string
}

export const Icon = memo(({ size = 15, rawSize, color, name, style, ...props }: IconProps) => {
  const theme = useTheme()
  const textShadow = useTextShadow()
  const resolvedName = ICON_MAP[name] || name
  const newStyle = textShadow ? StyleSheet.compose({
    textShadowColor: theme['c-primary-dark-300-alpha-800'],
    textShadowOffset: { width: 0.2, height: 0.2 },
    textShadowRadius: 2,
  }, style) : style
  return (
    <MCIcon
      name={resolvedName}
      size={rawSize ?? scaleSizeW(size)}
      color={color ?? theme['c-font']}
      style={newStyle}
      {...props}
    />
  )
})

export default Icon
