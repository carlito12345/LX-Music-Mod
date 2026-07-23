/**
 * Guide - 首次安装权限引导页
 */
import { memo, useState } from 'react'
import { View, TouchableOpacity, Linking, Platform } from 'react-native'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { toast } from '@/utils/tools'
import { pop } from '@/navigation'
import { createStyle } from '@/utils/tools'
import { updateSetting } from '@/core/common'

export interface GuideProps {
  componentId: string
}

const PERMISSIONS = [
  { key: 'storage', label: '存储权限', desc: '下载音乐文件需要访问存储空间', action: 'openSettings' },
  { key: 'notification', label: '通知权限', desc: '后台播放时需要显示通知控制播放', action: 'openSettings' },
  { key: 'battery', label: '忽略电池优化', desc: '后台播放时不被系统休眠', action: 'openBatterySettings' },
]

export default memo(({ componentId }: GuideProps) => {
  const theme = useTheme()
  const [step, setStep] = useState(0)

  const openAppSettings = () => {
    try {
      Linking.openSettings()
    } catch {}
  }

  const handleNext = () => {
    if (step < PERMISSIONS.length - 1) {
      setStep(step + 1)
    } else {
      // 标记引导已完成
      updateSetting({ 'common.guideDone': true } as any)
      toast('设置完成')
      void pop(componentId)
    }
  }

  const handleSkip = () => {
    updateSetting({ 'common.guideDone': true } as any)
    void pop(componentId)
  }

  const perm = PERMISSIONS[step]
  const btnColor = theme['c-primary'] || '#07c556'

  return (
    <View style={[styles.container, { backgroundColor: theme['c-content-background'] }]}>
      <View style={styles.topSection}>
        <Text style={styles.title} size={24} color={theme['c-primary-font']}>欢迎使用</Text>
        <Text style={styles.subtitle} size={16} color={theme['c-font-label']}>LX Music Mod</Text>
        <View style={styles.indicator}>
          {PERMISSIONS.map((_, i) => (
            <View key={i} style={[styles.dot, { backgroundColor: i === step ? btnColor : theme['c-font-label'] + '40' }]} />
          ))}
        </View>
      </View>

      <View style={styles.permSection}>
        <Text style={styles.permIcon} size={40}>{['📁', '🔔', '🔋'][step]}</Text>
        <Text style={styles.permLabel} size={18} color={theme['c-primary-font']}>{perm.label}</Text>
        <Text style={styles.permDesc} size={14} color={theme['c-font-label']}>{perm.desc}</Text>
      </View>

      <View style={styles.btnSection}>
        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: btnColor }]} onPress={handleNext}>
          <Text size={16} color={getContrastTextColor(btnColor)}>
            {step < PERMISSIONS.length - 1 ? '下一步' : '完成'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text size={14} color={theme['c-font-label']}>跳过</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
})

function getContrastTextColor(bg: string): string {
  const c = bg.replace('#', '')
  const r = parseInt(c.substring(0, 2), 16)
  const g = parseInt(c.substring(2, 4), 16)
  const b = parseInt(c.substring(4, 6), 16)
  if (isNaN(r) || isNaN(g) || isNaN(b)) return '#FFFFFF'
  return (r * 299 + g * 587 + b * 114) / 1000 > 128 ? '#000000' : '#FFFFFF'
}

const styles = createStyle({
  container: { flex: 1, paddingHorizontal: 30 },
  topSection: { flex: 2, justifyContent: 'center', alignItems: 'center' },
  title: { fontWeight: 'bold', marginBottom: 8 },
  subtitle: { marginBottom: 20 },
  indicator: { flexDirection: 'row', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  permSection: { flex: 3, justifyContent: 'center', alignItems: 'center' },
  permIcon: { marginBottom: 16 },
  permLabel: { fontWeight: '600', marginBottom: 8 },
  permDesc: { textAlign: 'center', paddingHorizontal: 20 },
  btnSection: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  primaryBtn: { width: '100%', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginBottom: 12 },
  skipBtn: { paddingVertical: 10 },
})
