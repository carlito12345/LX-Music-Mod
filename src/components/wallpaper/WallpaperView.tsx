/**
 * WallpaperView - Mineradio 风格粒子壁纸 WebView 组件
 * 加载 Canvas 粒子系统,通过 injectJavaScript 控制状态
 * 支持主题色跟随 / 自定义颜色 / 多彩渐变
 */
import React, { memo, useRef, useEffect, useCallback } from 'react'
import { View, StyleSheet } from 'react-native'
import { WebView, type WebViewMessageEvent } from 'react-native-webview'
import { useIsPlay } from '@/store/player/hook'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'

// 多彩渐变色组
const GRADIENT_COLORS = {
  primary: '#ec4899',
  secondary: '#8b5cf6',
  highlight: '#06b6d4',
  glow: '#f59e0b',
}

export const WallpaperView = memo(() => {
  const webviewRef = useRef<WebView>(null)
  const isPlay = useIsPlay()
  const mi = usePlayerMusicInfo()
  const theme = useTheme()
  const enabled = useSettingValue('playDetail.effect.wallpaper.enabled')
  const wallpaperColor = useSettingValue('playDetail.effect.wallpaper.color')
  const isReadyRef = useRef(false)

  const sendState = useCallback(() => {
    if (!isReadyRef.current || !webviewRef.current) return

    let colors: { primary: string; secondary: string; highlight: string; glow: string }

    if (wallpaperColor === 'gradient') {
      colors = GRADIENT_COLORS
    } else if (wallpaperColor && wallpaperColor !== '') {
      const c = wallpaperColor
      colors = { primary: c, secondary: c, highlight: '#fff0b8', glow: c }
    } else {
      // 跟随主题
      const c = theme['c-primary'] || '#d6f8ff'
      colors = { primary: c, secondary: c, highlight: '#fff0b8', glow: c }
    }

    const cover = mi.pic ? mi.pic.replace(/'/g, "\'") : ''
    const js = `
      try {
        applyState({
          playing: ${isPlay},
          cover: '${cover}',
          colors: {
            primary: '${colors.primary}',
            secondary: '${colors.secondary}',
            highlight: '${colors.highlight}',
            glow: '${colors.glow}'
          }
        });
      } catch(e) {}
      true;
    `
    webviewRef.current.injectJavaScript(js)
  }, [isPlay, mi.pic, theme, wallpaperColor])

  useEffect(() => {
    sendState()
  }, [sendState])

  const handleMessage = useCallback((e: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(e.nativeEvent.data)
      if (data.type === 'ready') {
        isReadyRef.current = true
        sendState()
      }
    } catch {}
  }, [sendState])

  if (!enabled) return null

  return (
    <View style={StyleSheet.absoluteFill}>
      <WebView
        ref={webviewRef}
        source={{ uri: 'file:///android_asset/wallpaper/index.html' }}
        style={StyleSheet.absoluteFill}
        backgroundColor="transparent"
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        allowFileAccessFromFileURLs
        scrollEnabled={false}
        bounces={false}
        onLoad={() => {
          isReadyRef.current = true
          sendState()
        }}
        onMessage={handleMessage}
      />
    </View>
  )
})
