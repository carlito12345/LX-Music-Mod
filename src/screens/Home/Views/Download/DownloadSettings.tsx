import { memo, useState } from 'react'
import { View, TouchableOpacity, ScrollView } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { downloadManager } from '@/core/download'
import { toast } from '@/utils/tools'
import RNFS from 'react-native-fs'

interface DownloadSettingsProps {
  onClose: () => void
}

export default memo(({ onClose }: DownloadSettingsProps) => {
  const t = useI18n()
  const theme = useTheme()
  const downloadPath = `${RNFS.ExternalStorageDirectoryPath}/Music/LXMusic`

  const handleClearCompleted = () => {
    downloadManager.clearHistory()
    toast(t('download_clear_completed_success'))
  }

  const handleClearHistory = () => {
    downloadManager.clearHistory()
    toast(t('download_clear_history_success'))
  }

  return (
    <View style={[styles.container, { backgroundColor: theme['c-content-background'] }]}>
      <View style={[styles.header, { borderBottomColor: theme['c-border-background'] }]}>
        <Text size={16} color={theme['c-font']}>{t('download_settings')}</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text size={14} color={theme['c-primary-font']}>{t('close')}</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={[styles.section, { backgroundColor: 'rgba(128,128,128,0.06)' }]}>
          <Text size={12} color={theme['c-font-label']}>{t('download_path')}</Text>
          <Text size={11} color={theme['c-font-label']} numberOfLines={2}>{downloadPath}</Text>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme['c-button-background'] }]}
          onPress={handleClearCompleted}
        >
          <Text size={14} color={theme['c-button-font']}>{t('download_clear_completed')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme['c-button-background'] }]}
          onPress={handleClearHistory}
        >
          <Text size={14} color={theme['c-button-font']}>{t('download_clear_history')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
})

const styles = createStyle({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  section: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
})
