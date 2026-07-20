# LX Music Mod

基于 [LX Music Mobile](https://github.com/lyswhut/lx-music-mobile) 的增强修改版。

## 新增功能

### 🎵 下载功能
- 歌曲菜单添加下载按钮
- 支持多种音质选择(128k / 192k / 320k / APE / FLAC)
- 自动权限引导,无权限时跳转系统设置授权
- 下载到公共 `Music/LXMusic` 目录,其他播放器可扫描
- 设置页下载管理(查看进度、分享文件)

### ✨ 流光进度条
- 渐变填充 + 高亮层
- 细长柔光流光动画(2秒循环)
- 呼吸发光刻度点(14px 主体 + 多层辉光)
- 设置开关控制

### 🎨 桌面歌词渐变
- 原生 Android LinearGradient 支持
- 流光溢彩、霓虹幻彩等预设渐变
- 自定义渐变编辑器(RGB 滑块 + 位置调节)

### 🖼 播放器背景自定义
- 主题色跟随模式
- 纯色背景(支持跟随封面主色)
- 封面图片高斯模糊背景
- 播放器设置弹窗内调节

### 🎭 封面样式
- 圆形 / 方形 / 圆角 / 黑胶唱片
- 发光光环特效
- 星河粒子特效
- 旋转动画
- 上下滑动切歌

### ⏱ 定时器
- 从播放器设置弹窗快速访问
- 定时停止播放

### 🔊 其他
- 上下滑动手势切歌
- 封面外圈呼吸发光
- 歌词居中对齐

## 基于

- [LX Music Mobile](https://github.com/lyswhut/lx-music-mobile) by lyswhut
- React Native
- Apache License 2.0

## 编译

参照[源码使用方法](https://lyswhut.github.io/lx-music-doc/mobile/use-source-code)设置开发环境。

```bash
npm install
npm run bundle-android
cd android && ./gradlew assembleDebug
```

APK 输出位置:`android/app/build/outputs/apk/debug/`

## 协议

本项目基于原项目 [Apache License 2.0](./LICENSE) 协议。
