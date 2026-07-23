import { memo, useMemo } from 'react'
import { TouchableOpacity, View } from 'react-native'
import { NAV_MENUS } from '@/config/constant'
import { setNavActiveId } from '@/core/common'
import { useI18n } from '@/lang'
import { useBgPic } from '@/store/common/hook'
import { useNavActiveId } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import { BorderWidths } from '@/theme'

interface TabItemProps {
  id: typeof NAV_MENUS[number]['id']
  icon: typeof NAV_MENUS[number]['icon']
}

const TabItem = ({ id, icon }: TabItemProps) => {
  const theme = useTheme()
  const bgPic = useBgPic()
  const t = useI18n()
  const activeId = useNavActiveId()
  const isActive = activeId == id
  const textColor = bgPic ? '#fff' : theme['c-font-label']
  const activeColor = bgPic ? '#fff' : (theme['c-primary-font-active'] || theme['c-primary'])

  /**
   * 切换底部导航页签。
   */
  const handlePress = () => {
    if (isActive) return
    setNavActiveId(id)
  }

  return (
    <TouchableOpacity
      style={[
        styles.item,
        isActive ? { backgroundColor: theme['c-primary-light-700-alpha-500'] } : null,
      ]}
      onPress={handlePress}
      activeOpacity={0.75}
    >
      <Icon
        name={icon}
        size={18}
        color={isActive ? activeColor : textColor}
      />
      <Text
        style={styles.label}
        size={11}
        color={isActive ? activeColor : textColor}
        numberOfLines={1}
      >
        {t(id)}
      </Text>
    </TouchableOpacity>
  )
}

export default memo(() => {
  const theme = useTheme()
  const bgPic = useBgPic()
  return (
    <View style={[
      styles.container,
      {
        borderTopColor: theme['c-border-background'],
        backgroundColor: bgPic ? 'rgba(0,0,0,0.3)' : theme['c-content-background'],
      },
    ]}>
      {NAV_MENUS.map(item => <TabItem key={item.id} id={item.id} icon={item.icon} />)}
    </View>
  )
})

const styles = createStyle({
  container: {
    borderTopWidth: BorderWidths.normal,
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingTop: 6,
    paddingBottom: 6,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  item: {
    flex: 1,
    minHeight: 42,
    marginHorizontal: 2,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 2,
  },
})
