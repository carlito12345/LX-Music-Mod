import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { View, TouchableOpacity, ScrollView } from 'react-native'
import Dialog, { type DialogType } from '@/components/common/Dialog'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { DOWNLOAD_QUALITIES } from '@/core/download'
import type { MusicInfoOnline } from '@/types/music'

export interface DownloadQualityModalType {
  show: (musicInfo: MusicInfoOnline) => void
}

export interface DownloadQualityModalProps {
  onDownload: (musicInfo: MusicInfoOnline, quality: string) => void
}

export default forwardRef<DownloadQualityModalType, DownloadQualityModalProps>(({ onDownload }, ref) => {
  const theme = useTheme()
  const dialogRef = useRef<DialogType>(null)
  const [musicInfo, setMusicInfo] = useState<MusicInfoOnline | null>(null)
  const [selectedQuality, setSelectedQuality] = useState('320k')

  useImperativeHandle(ref, () => ({
    show(info: MusicInfoOnline) {
      setMusicInfo(info)
      setSelectedQuality('320k')
      dialogRef.current?.setVisible(true)
    },
  }))

  const handleConfirm = () => {
    if (musicInfo) {
      onDownload(musicInfo, selectedQuality)
    }
    dialogRef.current?.setVisible(false)
  }

  const handleCancel = () => {
    dialogRef.current?.setVisible(false)
  }

  return (
    <Dialog ref={dialogRef} title="选择下载音质" bgHide closeBtn>
      <View style={styles.container}>
        <ScrollView style={styles.scroll}>
          {DOWNLOAD_QUALITIES.map(q => (
            <TouchableOpacity
              key={q.id}
              style={[
                styles.qualityItem,
                selectedQuality === q.id && { backgroundColor: theme['c-primary-background-active'] },
              ]}
              onPress={() => setSelectedQuality(q.id)}
            >
              <Text size={14} color={
                selectedQuality === q.id ? theme['c-primary-font-active'] : theme['c-font']
              }>
                {q.label}
              </Text>
              {selectedQuality === q.id && (
                <Text size={12} color={theme['c-primary']}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.buttons}>
          <TouchableOpacity style={[styles.btn, { backgroundColor: theme['c-button-background'] }]} onPress={handleCancel}>
            <Text size={14} color={theme['c-button-font']}>取消</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, { backgroundColor: theme['c-primary'] }]} onPress={handleConfirm}>
            <Text size={14} color="#fff">下载</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Dialog>
  )
})

const styles = createStyle({
  container: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  scroll: {
    maxHeight: 200,
    marginBottom: 15,
  },
  qualityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 4,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  btn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
})
