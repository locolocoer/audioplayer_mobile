import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.feiyu.music',
  appName: '飞鱼音乐',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // 允许局域网内通过 http 明文访问飞牛 NAS 的 WebDAV（Android 9+ 默认禁止明文 HTTP）
    cleartext: true
  },
  android: {
    // 允许 https 的 App 页面去请求 http 的局域网 WebDAV（混合内容）
    allowMixedContent: true
  },
  plugins: {
    SystemBars: {
      // 深色背景上用浅色状态栏图标；注入 --safe-area-inset-* CSS 变量修复状态栏重叠
      style: 'DARK',
      insetsHandling: 'css'
    }
  }
}

export default config
