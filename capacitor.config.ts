import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.feiyu.music',
  appName: '飞鱼音乐',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
}

export default config
