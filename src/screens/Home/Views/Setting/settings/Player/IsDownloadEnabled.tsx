import { memo, useCallback } from 'react'
import CheckBoxItem from '../../components/CheckBoxItem'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'

export default memo(() => {
  const t = useI18n()
  const enabled = useSettingValue('download.enabled')
  const handleChange = useCallback((v: boolean) => {
    updateSetting({ 'download.enabled': v })
  }, [])
  return <CheckBoxItem check={enabled} label={t('setting_download_enabled') || '下载'} onChange={handleChange} />
})
