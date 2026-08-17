# audoplayer_mobile

飞鱼音乐移动端 — Capacitor + React + TypeScript + Vite + zustand。

实现与桌面端一致的核心功能：WebDAV 云端播放、本地文件导入播放、播放列表/收藏/最近播放、歌词与封面、双语 i18n。

## 开发

```bash
npm install
npm run dev       # 浏览器预览 (端口 5174)
npm run build     # 生产构建
npx tsc --noEmit  # 类型检查
```

## 打包 Android

```bash
npx cap sync android
# 用 Android Studio 打开 android/ 目录构建 APK
```

## iOS

需在 macOS 上执行 `npx cap add ios` 后用 Xcode 构建。
