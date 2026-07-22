import React, { useEffect, useRef, useState } from 'react'
import { View, StyleSheet, Animated } from 'react-native'

interface Particle {
  id: number
  x: number
  y: number
  size: number
  opacity: Animated.Value
  speed: number
}

export const WhiteParticles: React.FC<{ enabled: boolean }> = ({ enabled }) => {
  if (!enabled) return null

  const [particles, setParticles] = useState<Particle[]>([])
  const animFrames = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // 初始化粒子
    const initialParticles: Particle[] = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      opacity: new Animated.Value(Math.random() * 0.3 + 0.1),
      speed: Math.random() * 0.5 + 0.2,
    }))
    setParticles(initialParticles)

    // 呼吸动画
    const animate = () => {
      initialParticles.forEach((particle) => {
        Animated.sequence([
          Animated.timing(particle.opacity, {
            toValue: Math.random() * 0.4 + 0.2,
            duration: 2000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
          Animated.timing(particle.opacity, {
            toValue: Math.random() * 0.2 + 0.05,
            duration: 2000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
        ]).start()
      })
    }

    animate()
    animFrames.current = setInterval(animate, 6000)

    return () => {
      if (animFrames.current) clearInterval(animFrames.current)
    }
  }, [])

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((particle) => (
        <Animated.View
          key={particle.id}
          style={[
            styles.particle,
            {
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
              opacity: particle.opacity,
            },
          ]}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 999,
    shadowColor: 'white',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
})
