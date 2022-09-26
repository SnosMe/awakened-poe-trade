import { reactive as deepReactive, shallowRef } from 'vue'
import { MainProcess } from '@/web/background/IPC'
import type { Config } from '@ipc/types'
import type { Widget } from './overlay/interfaces'

const _config = shallowRef<Config | null>(null)

export function AppConfig(): Config
export function AppConfig<T extends Widget>(type: string): T | undefined
export function AppConfig(type?: string) {
  if (!_config.value) {
    _config.value = deepReactive(MainProcess.getConfig())
  }

  if (!type) {
    return _config.value
  } else {
    return _config.value.widgets.find(w => w.wmType === type)
  }
}

export function updateConfig(updates: Config) {
  if (_config.value) {
    _config.value = deepReactive(JSON.parse(JSON.stringify(updates)))
  }
}

export function saveConfig() {
  MainProcess.saveConfig(JSON.parse(JSON.stringify(AppConfig())))
}

export function poeWebApi() {
  const { language, realm } = AppConfig()
  switch (language) {
    case 'en': return 'www.pathofexile.com'
    case 'ru': return 'ru.pathofexile.com'
    case 'cmn-Hant': return (realm === 'pc-garena')
      ? 'web.poe.garena.tw'
      : 'www.pathofexile.com'
    case 'zh_CN': return (realm === 'pc-tencent')
      ? 'poe.game.qq.com'
      : 'www.pathofexile.com'
  }
}
