import { memo, useEffect, useRef } from 'react'
import { View, TouchableOpacity, Animated, Easing } from 'react-native'
import { createStyle } from '@/utils/tools'
import { type ListInfoItem } from '@/store/songlist/state'
import Text from '@/components/common/Text'
import { scaleSizeW } from '@/utils/pixelRatio'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { useTheme } from '@/store/theme/hook'
import Image from '@/components/common/Image'

const gap = scaleSizeW(15)

const ShimmerOverlay = memo(() => {
  const anim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start()
  }, [anim])
  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  })
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: -100,
          width: 60,
          backgroundColor: 'rgba(255,255,255,0.12)',
          transform: [{ translateX }, { skewX: '-20deg' }],
        }}
      />
    </Animated.View>
  )
})

export default memo(({ item, index, width, showSource, onPress }: {
  item: ListInfoItem
  index: number
  showSource: boolean
  width: number
  onPress: (item: ListInfoItem, index: number) => void
}) => {
  const theme = useTheme()
  const itemWidth = width - gap
  const handlePress = () => { onPress(item, index) }

  // 呼吸浮动动画
  const breathe = useRef(new Animated.Value(0)).current
  useEffect(() => {
    const delay = Math.random() * 2000
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(breathe, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    ).start()
  }, [breathe])
  const translateY = breathe.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -4],
  })

  return (
    item.source
      ? (
          <Animated.View style={{ ...styles.listItem, width: itemWidth, transform: [{ translateY }] }}>
            <Animated.View style={{ ...styles.listItemImg, shadowColor: theme['c-primary'] }}>
              <TouchableOpacity activeOpacity={0.7} onPress={handlePress}>
                <Image
                  url={item.img}
                  nativeID={`${NAV_SHEAR_NATIVE_IDS.songlistDetail_pic}_from_${item.id}`}
                  style={{ width: itemWidth, height: itemWidth, borderRadius: 8 }}
                />
                {/* 扫光效果 */}
                <ShimmerOverlay />
                {/* 右上角标签徽章 */}
                {showSource && (
                  <View style={[styles.tagBadge, { backgroundColor: theme['c-primary'] }]}>
                    <Text size={8} color={theme['c-button-font']}>{item.source.toUpperCase()}</Text>
                  </View>
                )}
                {/* 底部渐变遮罩 */}
                <View style={styles.bottomOverlay} />
                {/* 播放次数 */}
                {item.play_count && (
                  <Text style={styles.playCount} size={9} color={theme['c-font-label']}>{item.play_count}</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
            <TouchableOpacity activeOpacity={0.7} onPress={handlePress}>
              <Text style={styles.listItemTitle} numberOfLines={2} color={theme['c-font']}>{item.name}</Text>
            </TouchableOpacity>
          </Animated.View>
        )
      : <View style={{ ...styles.listItem, width: itemWidth }} />
  )
})

const styles = createStyle({
  listItem: {
    margin: 10,
  },
  listItemImg: {
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  tagBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bottomOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '40%',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 8,
  },
  playCount: {
    position: 'absolute',
    bottom: 6,
    right: 8,
  },
  listItemTitle: {
    fontSize: 12,
    marginBottom: 5,
    lineHeight: 16,
  },
})
