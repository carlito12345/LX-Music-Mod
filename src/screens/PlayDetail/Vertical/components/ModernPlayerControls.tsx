/**
 * 现代化磨砂玻璃播放控制组件
 * 自动适应背景色,确保文字可见性
 */
import React, { useCallback } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { BlurView } from '@react-native-community/blur'
import { Icon } from '@/components/Icon'
import { usePlayerContext } from '@/hooks/usePlayerContext'
import {
  getContrastTextColor,
  getControlColor,
  getFrostedGlassBg,
  getFrostedGlassBorder,
} from '@/utils/colorContrast'
import { Text } from '@/components/Text'
import { useStore } from '@/store'

interface ModernPlayerControlsProps {
  backgroundColor: string
}

export const ModernPlayerControls: React.FC<ModernPlayerControlsProps> = ({ backgroundColor }) => {
  const { isPlaying, togglePlay, playPrev, playNext, playMode, togglePlayMode } = usePlayerContext()
  const { dispatch } = useStore()

  const textColor = getContrastTextColor(backgroundColor)
  const controlColor = getControlColor(backgroundColor)
  const glassBg = getFrostedGlassBg(backgroundColor)
  const glassBorder = getFrostedGlassBorder(backgroundColor)

  const handleShowPlaylist = useCallback(() => {
    dispatch({ type: 'SHOW_PLAYLIST' })
  }, [dispatch])

  const getPlayModeIcon = () => {
    switch (playMode) {
      case 'repeat': return 'repeat'
      case 'repeat-one': return 'repeat-one'
      case 'shuffle': return 'shuffle'
      default: return 'repeat'
    }
  }

  return (
    <View style={styles.container}>
      <BlurView
        style={[styles.glassContainer, { borderColor: glassBorder }]}
        blurType="light"
        blurAmount={20}
        reducedTransparencyFallbackColor={glassBg}
      >
        <View style={[styles.glassOverlay, { backgroundColor: glassBg }]} />
        
        {/* 控制按钮组 */}
        <View style={styles.controlsRow}>
          {/* 播放模式 */}
          <TouchableOpacity
            style={styles.controlButton}
            onPress={togglePlayMode}
            activeOpacity={0.7}
          >
            <Icon name={getPlayModeIcon()} size={24} color={controlColor} />
          </TouchableOpacity>

          {/* 上一曲 */}
          <TouchableOpacity
            style={styles.controlButton}
            onPress={playPrev}
            activeOpacity={0.7}
          >
            <Icon name="skip-previous" size={32} color={controlColor} />
          </TouchableOpacity>

          {/* 播放/暂停 */}
          <TouchableOpacity
            style={[styles.playButton, { backgroundColor: controlColor }]}
            onPress={togglePlay}
            activeOpacity={0.8}
          >
            <Icon
              name={isPlaying ? 'pause' : 'play'}
              size={32}
              color={backgroundColor}
            />
          </TouchableOpacity>

          {/* 下一曲 */}
          <TouchableOpacity
            style={styles.controlButton}
            onPress={playNext}
            activeOpacity={0.7}
          >
            <Icon name="skip-next" size={32} color={controlColor} />
          </TouchableOpacity>

          {/* 播放列表 */}
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleShowPlaylist}
            activeOpacity={0.7}
          >
            <Icon name="playlist" size={24} color={controlColor} />
          </TouchableOpacity>
        </View>

        {/* 歌曲信息 */}
        <View style={styles.songInfo}>
          <Text style={[styles.songTitle, { color: textColor }]} numberOfLines={1}>
            当前播放
          </Text>
          <Text style={[styles.songArtist, { color: getSecondaryTextColor(backgroundColor) }]} numberOfLines={1}>
            艺术家
          </Text>
        </View>
      </BlurView>
    </View>
  )
}

function getSecondaryTextColor(backgroundColor: string): string {
  const luminance = getLuminance(backgroundColor)
  return luminance > 0.5 ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)'
}

function getLuminance(hex: string): number {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return 0.5

  const r = parseInt(result[1], 16) / 255
  const g = parseInt(result[2], 16) / 255
  const b = parseInt(result[3], 16) / 255

  const rLinear = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4)
  const gLinear = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4)
  const bLinear = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4)

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 100,
  },
  glassContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  controlButton: {
    padding: 8,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  songInfo: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  songArtist: {
    fontSize: 14,
  },
})
