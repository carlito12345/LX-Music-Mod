# lx-music-mobile 项目完整注解

> 洛雪音乐助手 Android 版 | React Native 0.73 | v1.8.4
> 生成时间: 2025-07-18

---

## 一、项目架构总览

```
index.js → shim.js (Buffer polyfill)
         → src/app.ts (主入口)
              ├── core/init/ (初始化链,10步有序执行)
              ├── navigation/ (react-native-navigation 路由)
              ├── screens/ (UI 页面)
              ├── store/ (状态管理,无 Redux)
              ├── core/ (业务逻辑层)
              ├── components/ (共用组件)
              ├── plugins/ (播放器/同步/歌词/存储)
              ├── utils/musicSdk/ (6大音乐平台 SDK)
              ├── lang/ (i18n 多语言)
              └── theme/ (主题系统)
```

### 启动流程 (src/app.ts → core/init/index.ts)
1. 加载字体大小设置
2. 初始化 windowSizeTools
3. `initSetting()` - 加载/迁移设置
4. `initTheme()` - 加载主题,监听暗色模式
5. `initI18n()` - 初始化多语言
6. `initUserApi()` - 加载自定义 API 脚本
7. `setApiSource()` - 设置 API 源
8. `registerPlaybackService()` - 注册 TrackPlayer 后台服务
9. `initPlayer()` - 初始化播放器
10. `dataInit()` - 加载用户列表/不喜欢列表
11. `initCommonState()` - 初始化动态背景
12. `initSync()` - 连接同步服务器

---

## 二、状态管理系统 (src/store/)

### 设计模式:可变对象 + 事件总线 + React Hooks

**不使用 Redux/MobX**,采用极简三层架构:

| 层 | 文件 | 职责 |
|---|---|---|
| **state.ts** | 可变状态对象 | 直接修改属性,不 immutable |
| **action.ts** | 修改函数 | 修改 state + 触发 `global.state_event` |
| **hook.ts** | React Hooks | 订阅事件 → `useState` → re-render |

### 数据流
```
UI 交互 → core/ 业务函数 → store/action 修改 state
    → global.state_event.emit('xxxChanged', data)
    → hook 中 useEffect 监听 → setState
    → UI re-render
```

### 四个全局事件总线 (src/config/globalData.ts)
| 事件总线 | 创建方式 | 职责 |
|---|---|---|
| `global.app_event` | `createAppEventHub()` | 播放控制、列表更新、搜索等应用事件 |
| `global.list_event` | `createListEventHub()` | 列表 CRUD 操作(内部含持久化) |
| `global.dislike_event` | `createDislikeEventHub()` | 不喜欢列表操作 |
| `global.state_event` | `createStateEventHub()` | 状态变更通知(UI 订阅用) |

### Store 模块一览
| 模块 | state 关键字段 | 说明 |
|---|---|---|
| `player` | playMusicInfo, musicInfo, isPlay, progress, playedList, tempPlayList | 播放器核心状态 |
| `setting` | setting (LX.AppSetting) | 全局设置,100+ 配置项 |
| `list` | allMusicList(Map), defaultList, loveList, userList, activeListId | 歌曲列表管理 |
| `common` | fontSize, statusbarHeight, componentIds, navActiveId, bgPic | 通用 UI 状态 |
| `theme` | theme (LX.ActiveTheme), shouldUseDarkColors | 主题颜色 |
| `search` | searchType, searchText, historyList | 搜索状态 |
| `search/music` | listInfos (按源分页缓存) | 音乐搜索结果 |
| `search/songlist` | listInfos (按源分页缓存) | 歌单搜索结果 |
| `songlist` | tags, sortList, listDetailInfo | 歌单浏览 |
| `leaderboard` | boards, listDetailInfo | 排行榜 |
| `sync` | status, serverInfo | 同步状态 |
| `version` | versionInfo, progress | 版本更新 |
| `userApi` | list, status | 自定义 API |
| `hotSearch` | sources, sourceList | 热搜词 |
| `dislikeList` | dislikeInfo | 不喜欢规则 |

---

## 三、页面结构 (src/screens/)

### 页面注册 (navigation/registerScreens.tsx)
所有页面通过 `react-native-navigation` 注册,用 `<Provider>` 包裹(提供 ThemeContext):

| 屏幕名 | 组件 | 说明 |
|---|---|---|
| `lxm.HomeScreen` | Home | 主页(含5个子Tab) |
| `lxm.PlayDetailScreen` | PlayDetail | 播放详情页(横竖屏适配) |
| `lxm.SonglistDetailScreen` | SonglistDetail | 歌单详情 |
| `lxm.CommentScreen` | Comment | 评论页 |
| `lxm.VersionModal` | VersionModal | 版本更新弹窗 (overlay) |
| `lxm.PactModal` | PactModal | 用户协议弹窗 (overlay) |
| `lxm.SyncModeModal` | SyncModeModal | 同步模式选择弹窗 (overlay) |

### Home 页面结构 (screens/Home/)
```
Home
├── Vertical (竖屏模式)
│   ├── DrawerNav (侧滑菜单)
│   ├── Header (顶部标题栏)
│   └── Main (PagerView, 5页)
│       ├── Search (搜索)
│       ├── SongList (歌单)
│       ├── Leaderboard (排行榜)
│       ├── Mylist (我的列表)
│       └── Setting (设置)
└── Horizontal (横屏模式)
    ├── Aside (左侧导航)
    ├── Header
    └── Main
```

### PlayDetail 页面 (screens/PlayDetail/)
```
PlayDetail
├── Vertical (竖屏)
│   ├── Header (返回按钮)
│   ├── PagerView (2页滑动)
│   │   ├── Pic (封面图)
│   │   └── Lyric (歌词滚动)
│   └── Player (播放控制)
│       ├── PlayInfo (进度条+时间)
│       ├── ControlBtn (上一首/播放/下一首)
│       └── MoreBtn (收藏/模式/定时/添加/评论/桌面歌词)
└── Horizontal (横屏,左图右词)
```

---

## 四、核心业务逻辑 (src/core/)

### core/player/player.ts - 播放控制核心
**关键函数:**
- `playList(listId, index)` - 播放列表内指定歌曲
- `playNext(isAutoToggle)` - 下一曲(含已播放列表去重、随机模式)
- `playPrev(isAutoToggle)` - 上一曲
- `togglePlay()` - 播放/暂停切换
- `setMusicUrl(musicInfo)` - 获取播放 URL 并设置到 TrackPlayer
- `collectMusic()` / `uncollectMusic()` - 收藏/取消收藏
- `dislikeMusic()` - 不喜欢并跳下一首

**播放流程:**
```
playList() → setPlayMusicInfo() → handlePlay()
  → playerInitial() (首次初始化 TrackPlayer)
  → debouncePlay()
    → setMusicUrl() → getMusicPlayUrl()
      → getMusicUrl() (core/music, 含跨源降级)
    → getPicPath() → setMusicInfo({pic})
    → getLyricInfo() → setMusicInfo({lrc, tlrc, rlrc})
    → setResource() (TrackPlayer 加载音频)
```

### core/music/ - 音乐资源获取(含跨源降级)
**核心机制:** 当某源获取 URL/歌词失败时,自动搜索其他平台的同名歌曲重试

```
getMusicUrl(musicInfo)
  ├── online.ts → 在线歌曲
  ├── download.ts → 下载歌曲(委托给 online)
  └── local.ts → 本地歌曲(读取文件 + 跨源获取歌词)

utils.ts 关键函数:
  getOtherSource() - 在其他平台搜索同名歌曲
  getPlayQuality() - 根据设置选择音质 (128k/320k/flac/flac24bit)
  handleGetOnlineMusicUrl() - 获取 URL + 失败时跨源降级
  buildLyricInfo() - 构建歌词信息(含简繁转换)
```

### core/list.ts - 列表管理
所有操作通过 `global.list_event` 触发,事件内部自动持久化:
- `createUserList()` / `removeUserList()` - 创建/删除列表
- `addListMusics()` / `removeListMusics()` - 添加/移除歌曲
- `moveListMusics()` - 跨列表移动歌曲
- `overwriteListMusics()` - 覆盖列表内容
- `setActiveList()` - 切换当前列表

### core/lyric.ts - 歌词控制
同时控制应用内歌词和桌面歌词:
- `handlePlay(time)` - 同步播放歌词
- `setLyric()` - 设置歌词(含翻译/罗马音)
- `toggleTranslation()` / `toggleRoma()` - 切换显示

### core/sync.ts - 同步控制
- `selectSyncMode()` - 弹出同步模式选择对话框
- 通过 Navigation overlay 实现模态交互

---

## 五、音乐平台 SDK (src/utils/musicSdk/)

### 统一接口 (index.js)
```javascript
// 6个平台 + 1个已禁用
sources: [kw(酷我), kg(酷狗), tx(QQ), wy(网易), mg(咪咕)]
// bd(百度) 已禁用, xm(虾米) 仅保留空壳

// 统一方法
musicSearch.search(text, page, limit) → { list, total, allPage }
getMusicUrl(songInfo, type) → { promise } // type: 128k/320k/flac/flac24bit
getLyric(songInfo) → { promise } → { lyric, tlyric, rlyric, lxlyric }
getPic(songInfo) → promise → url
leaderboard.getBoards() → { list, source }
leaderboard.getList(id, page) → { list, total }
songList.getList(sortId, tagId, page) → { list, total }
songList.getListDetail(id, page) → { list, total, info }
comment.getComment(songInfo, page) → { comments, total }
hotSearch.getList() → { list, source }
tipSearch.search(text) → string[]

// 跨源搜索 (findMusic)
findMusic({name, singer, albumName, interval, source})
  → 在所有其他平台搜索 → 按匹配度排序返回
```

### 各平台特点

| 平台 | ID | 搜索 API | 加密方式 | 歌词特点 |
|---|---|---|---|---|
| **酷我 kw** | `kw` | `search.kuwo.cn` | XOR + Base64 (yeelion key) | 逐字歌词 (lxlyric),wbd AES 加密排行榜 |
| **酷狗 kg** | `kg` | `songsearch.kugou.com` | MD5 签名 (OIlwieks28dk2k...) | KRC 格式解密 (XOR + zlib),含翻译+罗马音 |
| **QQ tx** | `tx` | `u.y.qq.com/musics.fcg` | SHA1 → zzc 签名 (Native hashSHA1) | Base64 编码,含翻译 |
| **网易 wy** | `wy` | `interface3.music.163.com/eapi` | eapi 三重加密 (AES-ECB + MD5) | YRC 逐字歌词,含翻译+罗马音 |
| **咪咕 mg** | `mg` | `jadeite.migu.cn` | MD5 签名 (deviceId + signatureMd5) | MRC 逐字歌词 (AES 解密) |
| **百度 bd** | `bd` | `tingapi.ting.baidu.com` | 无 | 已禁用 |

### API 双轨制 (api-source.js)
```
内置 API → 直接调用各平台接口(当前 apiList 全部注释掉了)
user_api → 用户导入的自定义 JS 脚本(通过 Native QuickJS 执行)
```
- `global.lx.apis[source]` 存储 user_api 提供的方法
- 当 `common.apiSource` 以 `user_api` 开头时使用自定义 API
- 内置 API 的 `api-source-info.ts` 中 sources 数组为空

---

## 六、插件系统 (src/plugins/)

### player/ - TrackPlayer 封装
| 文件 | 职责 |
|---|---|
| `index.ts` | 初始化 TrackPlayer (缓存大小、音频焦点、offload) |
| `service.ts` | 注册 PlaybackService (远程控制事件: play/pause/next/prev/stop/seek) |
| `utils.ts` | setResource/setPlay/setPause/setStop/updateMetaData/initTrackInfo |
| `playList.ts` | TrackPlayer 队列管理 (addTrack/removeTrack/skip) |
| `hook.ts` | usePlaybackState / useProgress / useBufferProgress |

**TrackPlayer 事件映射:**
```
RemotePlay → play()
RemotePause → pause()
RemoteNext → playNext()
RemotePrevious → playPrev()
RemoteStop → exitApp()
RemoteSeek → setProgress()
PlaybackError → app_event.error()
PlaybackState → Playing→play() / Paused→pause() / Buffering→waiting()
PlaybackTrackChanged → 检查空队列 → pause()
```

### sync/ - 同步系统
```
sync/
├── index.ts - connectServer/disconnectServer 入口
├── constants.ts - SYNC_CODE/SYNC_CLOSE_CODE/TRANS_MODE
├── client/
│   ├── index.ts - connect/disconnect (WebSocket + 认证)
│   ├── client.ts - WebSocket 管理 + message2call RPC
│   ├── auth.ts - hello → getServerId → codeAuth/keyAuth
│   ├── utils.ts - encryptMsg/decryptMsg (AES)
│   ├── sync/ - RPC handler (服务端调用的方法)
│   └── modules/ - list/dislike 同步模块
│       ├── list/ - handler + localEvent (列表同步)
│       └── dislike/ - handler + localEvent (不喜欢同步)
```

**同步协议:**
1. HTTP `GET /hello` - 版本握手
2. HTTP `GET /id` - 获取服务器 ID
3. HTTP `POST /ah` - 认证 (authCode 或 keyInfo)
4. WebSocket `/socket` - 双向 RPC (message2call)

### lyric.ts - 歌词解析引擎
- 使用 `lrc-file-parser` 库解析 LRC 格式
- 支持翻译(translation)和罗马音(roma)作为 extendedLyrics
- `useLrcPlay()` / `useLrcSet()` React Hooks

### storage.ts - AsyncStorage 分片存储
- 单条数据超过 500KB 时自动分片存储
- 兼容旧版分隔符方式和新版数组方式
- `saveData` / `getData` / `removeData` / `getAllKeys`

---

## 七、原生模块桥接 (src/utils/nativeModules/)

| 模块 | NativeModule | 功能 |
|---|---|---|
| `crypto.ts` | `CryptoModule` | RSA 加解密、AES 加解密、SHA1 (用于 QQ 签名) |
| `lyricDesktop.ts` | `LyricModule` | 桌面悬浮歌词窗口 (显示/隐藏/播放/设置样式) |
| `userApi.ts` | `UserApiModule` | 加载/执行自定义 API 脚本 (QuickJS) |
| `utils.ts` | `UtilsModule` | exitApp、installApk、屏幕常亮、通知权限、窗口大小等 |
| `cache.ts` | `CacheModule` | 获取/清除应用缓存 |

---

## 八、主题系统 (src/theme/)

### 主题结构
```typescript
LX.Theme = {
  id: string          // 'green' / 'blue_plus' / 'happy_new_year' ...
  name: string        // 显示名称
  isDark: boolean     // 是否暗色
  isCustom: boolean   // 是否用户自定义
  config: {
    themeColors: {    // 基础色板 (c-primary + 10级 dark/light + alpha)
      'c-primary': string
      'c-primary-dark-100': string  // ~ 'c-primary-dark-1000'
      'c-primary-light-100': string // ~ 'c-primary-light-1000'
      'c-primary-alpha-100': string // ~ 'c-primary-alpha-900'
      'c-000' ~ 'c-1000': string   // 灰阶
    }
    extInfo: {        // 语义色 (按钮/背景/边框等)
      'bg-image': string
      // ... 由 buildActiveThemeColors 计算
    }
  }
}
```

### 内置主题 (themes/themes.ts)
由 `createThemes.js` 自动生成,包含:green, blue_plus, yellow, orange, red, pink, purple, grey, black, blue, china_ink, happy_new_year 等

### 主题应用流程
```
setTheme(id) → updateSetting → getTheme() → buildActiveThemeColors()
  → themeAction.setTheme(activeTheme)
  → global.state_event.themeUpdated()
  → ThemeContext.Provider 更新
  → useTheme() 触发 re-render
```

---

## 九、多语言 (src/lang/)

### 支持语言
- `zh_cn` 简体中文 (fallback)
- `zh_tw` 繁體中文
- `en_us` English

### i18n 实现 (i18n.ts)
```typescript
global.i18n = createI18n()
global.i18n.t('key', { param: value })  // 翻译函数
useI18n()  // React Hook,语言切换时自动更新
```

---

## 十、配置与常量 (src/config/)

### constant.ts - 全局常量
```typescript
LIST_IDS = { DEFAULT: 'default', LOVE: 'love', TEMP: 'temp', DOWNLOAD: 'download' }
COMPONENT_IDS = { home, playDetail, songlistDetail, comment }
NAV_SHEAR_NATIVE_IDS = { playDetail_pic, playDetail_header, playDetail_player, ... }
storageDataPrefix = { setting: '@setting_v1', userList: '@user_list', ... }
NAV_MENUS = [ search, songlist, top, love, setting ]
MUSIC_TOGGLE_MODE = { listLoop, random, list, singleLoop, none }
```

### defaultSetting.ts - 默认设置 (100+ 项)
关键设置分组:
- `common.*` - 通用 (语言/API源/抽屉位置/自动隐藏播放栏...)
- `player.*` - 播放器 (自动播放/音质/缓存/歌词翻译/蓝牙歌词...)
- `playDetail.*` - 播放详情 (歌词对齐/字号)
- `desktopLyric.*` - 桌面歌词 (位置/颜色/透明度/宽度)
- `list.*` - 列表 (点击播放/显示来源/添加位置)
- `search.*` - 搜索 (热搜/历史)
- `sync.*` - 同步
- `theme.*` - 主题 (ID/自动主题/动态背景/字体阴影)

### migrate.ts / migrateSetting.ts - 数据迁移
- v1.0 之前数据格式迁移
- 设置版本升级迁移

---

## 十一、共用组件 (src/components/)

| 组件 | 说明 |
|---|---|
| `player/PlayerBar` | 底部播放条 (封面+标题+进度+控制),出现在 Home/SonglistDetail |
| `player/ProgressBar` | 可拖拽进度条 (PanResponder) |
| `player/Progress` | 播放进度显示 (含缓冲进度) |
| `OnlineList` | 在线音乐列表 (含多选/菜单/添加弹窗) |
| `MusicAddModal` | 添加歌曲到列表弹窗 |
| `MusicMultiAddModal` | 批量添加歌曲弹窗 |
| `MetadataEditModal` | 本地歌曲元数据编辑 |
| `SearchTipList` | 搜索建议下拉列表 |
| `common/Button` | 通用按钮 |
| `common/Icon` | 图标组件 |
| `common/Text` | 文本组件 |
| `common/Input` | 输入框 |
| `common/Modal` | 模态框 |
| `common/Dialog` | 确认对话框 |
| `common/CheckBox` | 复选框 |
| `common/Slider` | 滑块 |
| `common/Image` / `ImageBackground` | 图片组件 (含预取) |
| `common/DrawerLayoutFixed` | 修复版抽屉布局 |
| `common/ChoosePath` | 文件路径选择器 |
| `common/StatusBar` | 状态栏 |
| `PageContent` | 页面容器 |
| `SizeView` | 尺寸监听 |
| `SourceSelector` | 音乐源选择器 |
| `DesktopLyricEnable` | 桌面歌词权限引导 |
| `TimeoutExitEditModal` | 定时退出设置 |

---

## 十二、全局变量 (global.lx)

```typescript
global.lx = {
  fontSize: number              // 字体缩放
  playerStatus: { isInitialized, isRegisteredService, isIniting }
  restorePlayInfo: SavedPlayInfo | null  // 恢复播放信息
  isScreenKeepAwake: boolean    // 屏幕常亮
  isPlayedStop: boolean         // 播放完退出
  isEnableSyncLog: boolean      // 同步日志开关
  isEnableUserApiLog: boolean   // API 日志开关
  playerTrackId: string         // 当前 TrackPlayer track ID
  gettingUrlId: string          // 正在获取 URL 的歌曲 ID
  qualityList: {}               // 各源支持的音质列表
  apis: {}                      // user_api 提供的方法
  apiInitPromise: [Promise, boolean, Function]  // API 初始化状态
  jumpMyListPosition: boolean   // 跳转到列表位置
  settingActiveId: string       // 设置页活动 tab
  homePagerIdle: boolean        // 首页 PagerView 空闲状态
}

global.i18n          // i18n 实例
global.app_event     // 应用事件总线
global.list_event    // 列表事件总线
global.dislike_event // 不喜欢事件总线
global.state_event   // 状态事件总线
```

---

## 十三、Android 原生层 (android/)

### 技术栈
- React Native 0.73.11
- Gradle 8.8 / AGP 8.6.1
- Kotlin 1.9.24
- NDK 29.0.14206865 (ARM64 Linux)
- Hermes JS 引擎
- compileSdk 36 / minSdk 21 / targetSdk 29

### 原生模块
| Java 模块 | 对应 JS | 功能 |
|---|---|---|
| `CryptoModule` | crypto.ts | RSA/AES 加解密、SHA1 |
| `LyricModule` | lyricDesktop.ts | 桌面悬浮歌词 (WindowManager) |
| `UserApiModule` | userApi.ts | QuickJS 脚本执行 |
| `UtilsModule` | utils.ts | 系统功能 (退出/安装/权限/通知) |
| `CacheModule` | cache.ts | 缓存管理 |

### 关键依赖
- `react-native-track-player` - 音频播放 (fork)
- `react-native-navigation` - 页面导航
- `react-native-pager-view` - 页面滑动
- `react-native-vector-icons` - 图标
- `react-native-quick-base64` / `quick-md5` - 编码
- `@react-native-async-storage/async-storage` - 持久化
- `lrc-file-parser` - 歌词解析
- `message2call` - RPC 通信

