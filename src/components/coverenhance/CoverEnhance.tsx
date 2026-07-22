import React from 'react'
import { View, StyleSheet } from 'react-native'

interface CoverEnhanceProps {
  children: React.ReactNode
}

export const CoverEnhance: React.FC<CoverEnhanceProps> = ({ children }) => {
  return (
    <View style={styles.container}>
      {/* 深色阴影层 */}
      <View style={styles.shadowLayer}>
        {children}
      </View>
      {/* 白色发光层 */}
      <View style={styles.glowLayer}>
        {children}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  shadowLayer: {
    shadowColor: 'rgba(0, 0, 0, 0.5)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 15,
  },
  glowLayer: {
    shadowColor: 'rgba(255, 255, 255, 0.3)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 8,
  },
})
