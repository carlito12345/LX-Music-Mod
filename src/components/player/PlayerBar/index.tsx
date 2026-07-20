import { memo, useMemo } from 'react'
import { View, StyleSheet } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useKeyboard } from '@/utils/hooks'
import { useSettingValue } from '@/store/setting/hook'
import Pic from './components/Pic'
import Title from './components/Title'
import PlayInfo from './components/PlayInfo'
import ControlBtn from './components/ControlBtn'

export default memo(({ isHome = false }: { isHome?: boolean }) => {
  const { keyboardShown } = useKeyboard()
  const theme = useTheme()
  const autoHidePlayBar = useSettingValue('common.autoHidePlayBar')

  const playerComponent = useMemo(() => (
    <View style={styles.wrapper}>
      {/* 顶部渐变发光条 */}
      <View style={[styles.glowTop, { backgroundColor: theme['c-primary-alpha-200'] }]} />
      <View style={[styles.container, { backgroundColor: theme['c-content-background'] }]}>
        <Pic isHome={isHome} />
        <View style={styles.center}>
          <Title isHome={isHome} />
          <PlayInfo isHome={isHome} />
        </View>
        <View style={styles.right}>
          <ControlBtn />
        </View>
      </View>
    </View>
  ), [theme, isHome])

  return autoHidePlayBar && keyboardShown ? null : playerComponent
})

const styles = createStyle({
  wrapper: {
    position: 'relative',
  },
  glowTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  container: {
    flexDirection: 'row',
    paddingLeft: 5,
    paddingTop: 4,
    paddingBottom: 4,
  },
  center: {
    flexDirection: 'column',
    flexGrow: 1,
    flexShrink: 1,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 0,
    flexShrink: 0,
    paddingLeft: 5,
    paddingRight: 5,
  },
})
