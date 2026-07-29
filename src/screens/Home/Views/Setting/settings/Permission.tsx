/**
 * Permission - 权限管理页面
 * 显示 App 所有权限状态并支持跳转设置
 */
import { memo, useState, useEffect } from 'react'
import { View, Platform } from 'react-native'
import { createStyle, toast } from '@/utils/tools'
import SubTitle from '../components/SubTitle'
import Button from '../components/Button'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'

interface PermissionItem {
  key: string
  label: string
  description: string
  check: () => Promise<boolean>
  request: () => Promise<boolean>
}

export default memo(() => {
  const t = useI18n()
  const [perms, setPerms] = useState<Record<string, boolean>>({})

  const permissionList: PermissionItem[] = [
    {
      key: 'overlay',
      label: '悬浮窗权限',
      description: '迷你播放器需要悬浮窗权限',
      check: async () => {
        try {
          const { MiniPlayerModule } = require('react-native').NativeModules
          return await MiniPlayerModule.hasOverlayPermission()
        } catch { return false }
      },
      request: async () => {
        try {
          const { MiniPlayerModule } = require('react-native').NativeModules
          await MiniPlayerModule.openOverlaySettings()
          return true
        } catch { return false }
      },
    },
    {
      key: 'storage',
      label: '存储权限',
      description: '下载歌曲和保存日志需要存储权限',
      check: async () => {
        try {
          if (Platform.OS === 'android' && Platform.Version >= 30) return true // scoped storage
          const { PermissionsAndroid } = require('react-native')
          const result = await PermissionsAndroid.check('android.permission.WRITE_EXTERNAL_STORAGE')
          return result
        } catch { return false }
      },
      request: async () => {
        try {
          if (Platform.OS === 'android' && Platform.Version >= 30) { toast('Android 11+ 使用文件管理器访问'); return true }
          const { PermissionsAndroid } = require('react-native')
          const result = await PermissionsAndroid.request('android.permission.WRITE_EXTERNAL_STORAGE')
          return result === 'granted'
        } catch { return false }
      },
    },
    {
      key: 'notification',
      label: '通知权限',
      description: '后台播放控制需要通知权限',
      check: async () => {
        try {
          if (Platform.OS === 'android' && Platform.Version >= 33) {
            const { PermissionsAndroid } = require('react-native')
            const result = await PermissionsAndroid.check('android.permission.POST_NOTIFICATIONS')
            return result
          }
          return true
        } catch { return false }
      },
      request: async () => {
        try {
          if (Platform.OS === 'android' && Platform.Version >= 33) {
            const { PermissionsAndroid } = require('react-native')
            const result = await PermissionsAndroid.request('android.permission.POST_NOTIFICATIONS')
            return result === 'granted'
          }
          return true
        } catch { return false }
      },
    },
    {
      key: 'mediaLocation',
      label: '媒体位置权限',
      description: '读取音乐文件信息需要',
      check: async () => {
        try {
          if (Platform.OS === 'android' && Platform.Version >= 33) return true
          const { PermissionsAndroid } = require('react-native')
          const result = await PermissionsAndroid.check('android.permission.READ_EXTERNAL_STORAGE')
          return result
        } catch { return false }
      },
      request: async () => {
        try {
          if (Platform.OS === 'android' && Platform.Version >= 33) { toast('Android 13+ 自动授权'); return true }
          const { PermissionsAndroid } = require('react-native')
          const result = await PermissionsAndroid.request('android.permission.READ_EXTERNAL_STORAGE')
          return result === 'granted'
        } catch { return false }
      },
    },
    {
      key: 'phone',
      label: '设备权限(读取设备状态)',
      description: '用于车机识别',
      check: async () => {
        try {
          if (Platform.OS === 'android' && Platform.Version >= 30) return true
          const { PermissionsAndroid } = require('react-native')
          return await PermissionsAndroid.check('android.permission.READ_PHONE_STATE')
        } catch { return false }
      },
      request: async () => {
        try {
          const { PermissionsAndroid } = require('react-native')
          const result = await PermissionsAndroid.request('android.permission.READ_PHONE_STATE')
          return result === 'granted'
        } catch { return false }
      },
    },
  ]

  const checkAll = async () => {
    const results: Record<string, boolean> = {}
    for (const p of permissionList) {
      try {
        results[p.key] = await p.check()
      } catch {
        results[p.key] = false
      }
    }
    setPerms({ ...results })
  }

  const handleRequest = async (item: PermissionItem) => {
    const result = await item.request()
    if (result) {
      toast(`${item.label}: 已授权`)
      checkAll()
    } else {
      toast(`${item.label}: 授权失败,请前往系统设置手动开启`)
    }
  }

  useEffect(() => { checkAll() }, [])

  return (
    <View>
      <SubTitle title="权限状态">
        {permissionList.map(p => (
          <View key={p.key} style={styles.item}>
            <View style={styles.info}>
              <View style={styles.row}>
                <Text size={15}>{p.label}</Text>
                <View style={[styles.badge, { backgroundColor: perms[p.key] ? '#4CAF50' : '#F44336' }]}>
                  <Text size={11} color="#fff">{perms[p.key] ? '已授权' : '未授权'}</Text>
                </View>
              </View>
              <Text size={12} color="#999">{p.description}</Text>
            </View>
            {!perms[p.key] && (
              <Button onPress={() => handleRequest(p)}>去授权</Button>
            )}
          </View>
        ))}
      </SubTitle>
      <View style={styles.footer}>
        <Button onPress={checkAll}>刷新状态</Button>
      </View>
    </View>
  )
})

const styles = createStyle({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 16,
  },
})
