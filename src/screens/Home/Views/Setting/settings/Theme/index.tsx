import { memo } from 'react'

import AppCardSection from '../../components/AppCardSection'
import Theme from './Theme'
import IsAutoTheme from './IsAutoTheme'
import IsHideBgDark from './IsHideBgDark'
import IsDynamicBg from './IsDynamicBg'
import IsFontShadow from './IsFontShadow'
import IsGlobalAurora from './IsGlobalAurora'

export default memo(() => {
  return (
    <>
      <AppCardSection title="主题">
        <Theme />
        <IsAutoTheme />
        <IsHideBgDark />
        <IsFontShadow />
      </AppCardSection>
      <AppCardSection title="背景">
        <IsDynamicBg />
        <IsGlobalAurora />
      </AppCardSection>
    </>
  )
})
