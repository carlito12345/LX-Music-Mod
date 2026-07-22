/**
 * Lyric3DView - 3D 桌面歌词样式 WebView 组件
 * 基于 Mineradio desktop-lyrics 简化版
 * 3D 倾斜 + 边缘遮罩 + 节拍发光
 */
import React, { memo, useRef, useEffect, useCallback } from 'react'
import { View, StyleSheet } from 'react-native'
import { WebView, type WebViewMessageEvent } from 'react-native-webview'
import { useIsPlay } from '@/store/player/hook'
import { useLrcPlay } from '@/plugins/lyric'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'

export const Lyric3DView = memo(() => {
  const webviewRef = useRef<WebView>(null)
  const isPlay = useIsPlay()
  const { text: currentLine } = useLrcPlay()
  const theme = useTheme()
  const enabled = useSettingValue('playDetail.effect.lyric3d.enabled')
  const isReadyRef = useRef(false)

  const sendState = useCallback(() => {
    if (!isReadyRef.current || !webviewRef.current) return
    const primary = theme['c-primary'] || '#9cffdf'
    const lyricText = (currentLine || '').replace(/'/g, "\\'").replace(/\n/g, ' ')
    const js = `
      try {
        applyState({
          playing: ${isPlay},
          text: '${lyricText}',
          color: '${primary}'
        });
      } catch(e) {}
      true;
    `
    webviewRef.current.injectJavaScript(js)
  }, [isPlay, currentLine, theme])

  useEffect(() => {
    sendState()
  }, [sendState])

  if (!enabled) return null

  return (
    <View style={styles.container} pointerEvents="none">
      <WebView
        ref={webviewRef}
        source={{ uri: 'file:///android_asset/lyric3d/index.html' }}
        style={StyleSheet.absoluteFill}
        backgroundColor="transparent"
        javaScriptEnabled
        domStorageEnabled={false}
        allowFileAccess
        scrollEnabled={false}
        bounces={false}
        onLoad={() => {
          isReadyRef.current = true
          sendState()
        }}
        onMessage={(e: WebViewMessageEvent) => {}}
      />
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 120,
    height: 160,
  },
})
