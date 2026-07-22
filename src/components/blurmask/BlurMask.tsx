import React from 'react'
import { View, StyleSheet } from 'react-native'
import { BlurView } from '@react-native-community/blur'

interface BlurMaskProps {
  blurAmount?: number
  maskOpacity?: number
  maskColor?: string
}

export const BlurMask: React.FC<BlurMaskProps> = ({
  blurAmount = 20,
  maskOpacity = 0.75,
  maskColor = 'rgba(245, 240, 235, 0.9)',
}) => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType="light"
        blurAmount={blurAmount}
        reducedTransparencyFallbackColor="white"
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: maskColor,
            opacity: maskOpacity,
          },
        ]}
      />
    </View>
  )
}
