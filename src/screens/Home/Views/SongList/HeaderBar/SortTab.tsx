import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { ScrollView, TouchableOpacity } from 'react-native'
import songlistState, { type SortInfo, type Source } from '@/store/songlist/state'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'

export interface SortTabProps {
  onSortChange: (id: string) => void
}

export interface SortTabType {
  setSource: (source: Source, activeTab: SortInfo['id']) => void
}

export default forwardRef<SortTabType, SortTabProps>(({ onSortChange }, ref) => {
  const [sortList, setSortList] = useState<SortInfo[]>([])
  const [activeId, setActiveId] = useState<SortInfo['id']>('')
  const t = useI18n()
  const theme = useTheme()
  const scrollViewRef = useRef<ScrollView>(null)

  useImperativeHandle(ref, () => ({
    setSource(source, activeTab) {
      scrollViewRef.current?.scrollTo({ x: 0 })
      setSortList(songlistState.sortList[source]!)
      setActiveId(activeTab)
    },
  }))

  const sorts = useMemo(() => {
    return sortList.map(s => ({ label: t(`songlist_${s.tid}`), id: s.id }))
  }, [sortList, t])

  const handleSortChange = (id: string) => {
    onSortChange(id)
    setActiveId(id)
  }

  return (
    <ScrollView ref={scrollViewRef} style={styles.container} keyboardShouldPersistTaps={'always'} horizontal showsHorizontalScrollIndicator={false}>
      {
        sorts.map(s => {
          const isActive = activeId == s.id
          return (
            <TouchableOpacity key={s.id} style={styles.button} onPress={() => handleSortChange(s.id)}>
              <Text
                size={14}
                color={isActive ? theme['c-primary-font-active'] : theme['c-font-label']}
                style={isActive ? styles.activeText : null}
              >
                {s.label}
              </Text>
              {isActive && (
                <View style={[styles.indicator, { backgroundColor: theme['c-primary'] }]} />
              )}
            </TouchableOpacity>
          )
        })
      }
    </ScrollView>
  )
})

const styles = createStyle({
  container: {
    flexGrow: 1,
    flexShrink: 1,
    paddingTop: 6,
    paddingBottom: 4,
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 6,
    paddingBottom: 6,
    position: 'relative',
  },
  activeText: {
    fontWeight: '700',
  },
  indicator: {
    position: 'absolute',
    bottom: 2,
    left: '30%',
    right: '30%',
    height: 3,
    borderRadius: 2,
  },
})
