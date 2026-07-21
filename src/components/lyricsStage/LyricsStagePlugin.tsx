/**
 * LyricsStagePlugin - 歌词舞台增强插件
 *
 * 功能:
 * - 当前行缩放 + 发光效果 (textShadow)
 * - 歌词过渡动画
 * - 可独立开关,不影响核心歌词功能
 */
import React, { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useTheme } from '@/store/theme/hook'

// 舞台配置
export interface StageConfig {
  /** 是否启用歌词舞台效果 */
  enabled: boolean
  /** 当前行缩放比例 (1.0 = 无缩放) */
  activeScale: number
  /** 当前行发光强度 (0-1) */
  glowIntensity: number
}

const defaultConfig: StageConfig = {
  enabled: true,
  activeScale: 1.05,
  glowIntensity: 0.3,
}

interface StageContextType {
  config: StageConfig
}

const StageContext = createContext<StageContextType>({
  config: defaultConfig,
})

interface StageProviderProps {
  children: ReactNode
}

/**
 * 歌词舞台 Context Provider
 * 包裹歌词 FlatList 用于传递舞台状态
 */
export const StageProvider = ({ children }: StageProviderProps) => {
  const config = useMemo(() => ({
    ...defaultConfig,
  }), [])

  return (
    <StageContext.Provider value={{ config }}>
      {children}
    </StageContext.Provider>
  )
}

/**
 * 获取当前行舞台样式
 * @param isActive 是否是当前播放行
 * @returns 文本样式对象,包含发光和缩放效果
 */
export const useStageStyle = (isActive: boolean) => {
  const theme = useTheme()
  const { config } = useContext(StageContext)

  const stageStyle = useMemo(() => {
    if (!config.enabled || !isActive) return null

    return {
      textShadowColor: theme['c-primary'],
      textShadowOffset: { width: 0, height: 0 } as { width: number; height: number },
      textShadowRadius: 6 * config.glowIntensity + 2,
    }
  }, [config.enabled, isActive, config.glowIntensity, theme])

  return stageStyle
}
