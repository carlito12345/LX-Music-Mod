/**
 * SlideshowBg - 背景幻灯片组件
 * 加载 slideshow 图片,渐变切换背景
 */
import React, { memo, useRef, useEffect, useCallback } from 'react'
import { View, StyleSheet } from 'react-native'
import { WebView, type WebViewMessageEvent } from 'react-native-webview'
import { useSettingValue } from '@/store/setting/hook'

const IMAGES = [
  'file:///android_asset/slideshow/033F7996B538AE57CB08A30818E1EA83.jpg',
  'file:///android_asset/slideshow/11FE9EA12DB567F8F548270E8B596B71.jpg',
  'file:///android_asset/slideshow/3272673D6E1636DBDEFE79ABF996465D.jpg',
  'file:///android_asset/slideshow/8DB2F673A49C9EF4909F6DD63BDF382E.jpg',
  'file:///android_asset/slideshow/953EF43FDD636F6CB5F9FCD95C0F64A3.jpg',
  'file:///android_asset/slideshow/96E608432C65E95CA7495E7F73DC7221.jpg',
  'file:///android_asset/slideshow/D8EEC17A7C89E56DEF062D5AD9213EBC.jpg',
  'file:///android_asset/slideshow/F56FB27A19271D118CA27C5FC19656B3.jpg',
]

export const SlideshowBg = memo(() => {
  const webviewRef = useRef<WebView>(null)
  const enabled = useSettingValue('playDetail.effect.slideshow.enabled')
  const isReadyRef = useRef(false)
  const currentIndexRef = useRef(0)

  const switchImage = useCallback(() => {
    if (!isReadyRef.current || !webviewRef.current) return
    currentIndexRef.current = (currentIndexRef.current + 1) % IMAGES.length
    const js = `
      try { switchTo('${IMAGES[currentIndexRef.current]}'); } catch(e) {}
      true;
    `
    webviewRef.current.injectJavaScript(js)
  }, [])

  useEffect(() => {
    if (!enabled) return
    const timer = setInterval(switchImage, 8000)
    return () => clearInterval(timer)
  }, [enabled, switchImage])

  if (!enabled) return null

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <WebView
        ref={webviewRef}
        source={{ uri: 'file:///android_asset/slideshow/index.html' }}
        style={StyleSheet.absoluteFill}
        backgroundColor="transparent"
        javaScriptEnabled
        domStorageEnabled={false}
        allowFileAccess
        scrollEnabled={false}
        bounces={false}
        onLoad={() => {
          isReadyRef.current = true
          const js = `switchTo('${IMAGES[0]}'); true;`
          webviewRef.current?.injectJavaScript(js)
        }}
        onMessage={(e: WebViewMessageEvent) => {}}
      />
    </View>
  )
})
