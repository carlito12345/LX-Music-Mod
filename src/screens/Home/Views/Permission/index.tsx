/**
 * Permission - 权限管理页面(独立)
 * 友好展示各权限状态,支持一键跳转系统设置
 */
import { memo, useState, useCallback, useEffect } from 'react'
import { AppState } from 'react-native'
import { View, TouchableOpacity, ScrollView, RefreshControl } from 'react-native'
import { createStyle, toast } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useStatusbarHeight } from '@/store/common/hook'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'

const { PermissionModule, MiniPlayerModule } = require('react-native').NativeModules as any

interface PermissionItem {
  key: string
  label: string
  description: string
  icon: string
  check: () => Promise<boolean>
  open: () => Promise<void> | void
}

export default memo(() => {
  const theme = useTheme()
  const statusBarHeight = useStatusbarHeight()
  const [permStatus, setPermStatus] = useState<Record<string, boolean>>({})
  const [refreshing, setRefreshing] = useState(false)

  const permissionList: PermissionItem[] = [
    {
      key: 'overlay',
      label: '悬浮窗权限',
      description: '迷你播放器、桌面歌词显示需要',
      icon: 'windows',
      check: async () => {
        try { return await MiniPlayerModule.hasOverlayPermission() } catch { return false }
      },
      open: () => MiniPlayerModule.openOverlaySettings(),
    },
    {
      key: 'manageStorage',
      label: '所有文件访问权限',
      description: '选择本地音乐目录、下载歌曲到任意位置需要',
      icon: 'folder',
      check: async () => {
        try { return await PermissionModule.hasManageExternalStoragePermission() } catch { return false }
      },
      open: () => PermissionModule.openManageExternalStorageSettings(),
    },
    {
      key: 'notification',
      label: '通知权限',
      description: '后台播放控制、通知栏歌曲信息需要',
      icon: 'bell',
      check: async () => {
        try { return await PermissionModule.hasNotificationPermission() } catch { return false }
      },
      open: () => PermissionModule.openNotificationSettings(),
    },
    {
      key: 'battery',
      label: '电池优化(后台运行)',
      description: '关闭优化,保证后台持续播放',
      icon: 'battery',
      check: async () => {
        try { return await PermissionModule.hasIgnoreBatteryOptimization() } catch { return false }
      },
      open: () => PermissionModule.openBatteryOptimizationSettings(),
    },
    {
      key: 'appDetails',
      label: '应用详情设置',
      description: '手动管理应用其他权限',
      icon: 'setting',
      check: async () => true, // 始终可点,用于兜底
      open: () => PermissionModule.openAppDetails(),
    },
  ]

  const checkAll = useCallback(async () => {
    const results: Record<string, boolean> = {}
    for (const p of permissionList) {
      try {
        results[p.key] = await p.check()
      } catch {
        results[p.key] = false
      }
    }
    setPermStatus({ ...results })
  }, [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await checkAll()
    setRefreshing(false)
  }, [checkAll])

  // 实时监控: App 回到前台时自动刷新权限状态
  useEffect(() => {
    void checkAll()
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void checkAll()
    })
    return () => sub.remove()
  }, [checkAll])

  const handleOpen = async (item: PermissionItem) => {
    try {
      await item.open()
      toast(`已跳转到${item.label}设置`)
    } catch {
      toast('跳转失败,请手动前往系统设置')
    }
    // 延迟刷新状态(用户可能已授权)
    setTimeout(() => { void checkAll() }, 1500)
  }

  return (
    <View style={[styles.container, { paddingTop: statusBarHeight }]}>
      <View style={styles.header}>
        <Text size={20} color={theme['c-font']} style={styles.title}>权限管理</Text>
        <Text size={12} color={theme['c-font-label']}>管理应用所需的系统权限</Text>
      </View>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
      >
        {permissionList.map(p => {
          const granted = permStatus[p.key]
          return (
            <TouchableOpacity
              key={p.key}
              style={[styles.item, { backgroundColor: theme['c-card-background'] || theme['c-content-background'] }]}
              onPress={() => handleOpen(p)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrap, { backgroundColor: granted ? '#4CAF5022' : '#F4433622' }]}>
                <Icon name={p.icon} color={granted ? '#4CAF50' : '#F44336'} size={22} />
              </View>
              <View style={styles.info}>
                <View style={styles.row}>
                  <Text size={15} color={theme['c-font']}>{p.label}</Text>
                  <View style={[styles.badge, { backgroundColor: granted ? '#4CAF50' : '#F44336' }]}>
                    <Text size={11} color="#fff">{granted === undefined ? '检测中' : granted ? '已授权' : '未授权'}</Text>
                  </View>
                </View>
                <Text size={12} color={theme['c-font-label']}>{p.description}</Text>
              </View>
              <Icon name="chevron-right" color={theme['c-font-label']} size={20} />
            </TouchableOpacity>
          )
        })}
        <TouchableOpacity style={[styles.refreshBtn, { backgroundColor: theme['c-primary'] }]} onPress={() => void checkAll()}>
          <Text size={14} color="#fff">重新检测全部权限</Text>
        </TouchableOpacity>
        <Text size={11} color={theme['c-font-label']} style={styles.tip}>
          提示: 权限状态会随系统设置变化,如遇异常请点击刷新检测
        </Text>
      </ScrollView>
    </View>
  )
})

const styles = createStyle({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontWeight: '600' },
  list: { paddingHorizontal: 15, paddingBottom: 30 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  refreshBtn: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  tip: { textAlign: 'center', marginTop: 12 },
})
