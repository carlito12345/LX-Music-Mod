import { memo } from 'react'

import Theme from '../Theme'
import AppCardSection from '../../components/AppCardSection'
import Source from './Source'
import SourceName from './SourceName'
import Language from './Language'
import FontSize from './FontSize'
import ShareType from './ShareType'
import IsStartupAutoPlay from './IsStartupAutoPlay'
import IsStartupPushPlayDetailScreen from './IsStartupPushPlayDetailScreen'
import IsAutoHidePlayBar from './IsAutoHidePlayBar'
import IsHomePageScroll from './IsHomePageScroll'
import IsAllowProgressBarSeek from './IsAllowProgressBarSeek'
import IsUseSystemFileSelector from './IsUseSystemFileSelector'
import IsAlwaysKeepStatusbarHeight from './IsAlwaysKeepStatusbarHeight'
import IsShowBackBtn from './IsShowBackBtn'
import IsShowExitBtn from './IsShowExitBtn'
import DrawerLayoutPosition from './DrawerLayoutPosition'
import { useI18n } from '@/lang/i18n'

export default memo(() => {
  const t = useI18n()


  return (
    <>
      <AppCardSection title={t('setting_basic')}>
        <IsStartupAutoPlay />
        <IsStartupPushPlayDetailScreen />
        <IsShowBackBtn />
        <IsShowExitBtn />
        <IsAutoHidePlayBar />
        <IsHomePageScroll />
        <IsAllowProgressBarSeek />
        <IsUseSystemFileSelector />
        <IsAlwaysKeepStatusbarHeight />
        <DrawerLayoutPosition />
        <Language />
        <FontSize />
        <ShareType />
        <Source />
        <SourceName />
      </AppCardSection>
      {/* 主题设置独立分组, 不被基本设置卡片包围 */}
      <Theme />
    </>
  )
})
