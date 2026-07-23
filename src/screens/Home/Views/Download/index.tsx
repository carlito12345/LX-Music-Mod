import { memo, useState, useCallback } from 'react'
import { View, TouchableOpacity } from 'react-native'

import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { useDownloadTasks, useDownloadHistory } from '@/store/download/hook'
import DownloadList from './DownloadList'
import HistoryList from './HistoryList'
import DownloadSettings from './DownloadSettings'

const Tab = memo(({ label, active, onPress }: {
  label: string
  active: boolean
  onPress: () => void
}) => {
  const theme = useTheme()
  return (
    <TouchableOpacity
      style={{
        ...styles.tab,
        borderBottomWidth: active ? 2 : 0,
        borderBottomColor: active ? theme['c-primary'] : 'transparent',
      }}
      onPress={onPress}
    >
      <Text color={active ? theme['c-primary-font'] : theme['c-font-label']} size={14}>{label}</Text>
    </TouchableOpacity>
  )
})

export default memo(() => {
  const t = useI18n()
  const theme = useTheme()
  const [activeTab, setActiveTab] = useState<'tasks' | 'history'>('tasks')
  const [showSettings, setShowSettings] = useState(false)
  const tasks = useDownloadTasks()
  const history = useDownloadHistory()

  const handleTabChange = useCallback((tab: 'tasks' | 'history') => {
    setActiveTab(tab)
  }, [])

  const handleSettingsClose = useCallback(() => {
    setShowSettings(false)
  }, [])

  return (
    <View style={styles.container}>
      <View style={{ ...styles.header, borderBottomColor: theme['c-border-background'] }}>
        <View style={styles.headerTop}>
          <Text style={styles.title} size={18} color={theme['c-font']}>{t('download_title')}</Text>
          <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.settingsBtn}>
            <Icon name="setting" size={22} color={theme['c-primary-font']} />
          </TouchableOpacity>
        </View>
        <View style={styles.tabs}>
          <Tab
            label={`${t('download_tab_tasks')} (${tasks.length})`}
            active={activeTab === 'tasks'}
            onPress={() => handleTabChange('tasks')}
          />
          <Tab
            label={`${t('download_tab_history')} (${history.length})`}
            active={activeTab === 'history'}
            onPress={() => handleTabChange('history')}
          />
        </View>
      </View>
      {
        activeTab === 'tasks'
          ? <DownloadList />
          : <HistoryList />
      }
      {showSettings && <DownloadSettings onClose={handleSettingsClose} />}
    </View>
  )
})

const styles = createStyle({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  header: {
    padding: 15,
    paddingBottom: 0,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    marginBottom: 0,
  },
  settingsBtn: {
    padding: 10,
  },
  tabs: {
    flexDirection: 'row',
  },
  tab: {
    marginRight: 20,
    paddingBottom: 8,
  },
})
