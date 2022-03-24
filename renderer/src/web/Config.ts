import { reactive as deepReactive, shallowRef } from 'vue'
import { MainProcess } from '@/web/background/IPC'
import type { Config } from '@/../../ipc/types'
import type { Widget } from './overlay/interfaces'

const _config = shallowRef<Config | null>(null)

export function AppConfig (): Config
export function AppConfig<T extends Widget> (type: string): T | undefined
export function AppConfig (type?: string) {
  if (!_config.value) {
    _config.value = deepReactive(MainProcess.getConfig())
  }

  if (!type) {
    return _config.value
  } else {
    return _config.value.widgets.find(w => w.wmType === type)
  }
}

export function updateConfig (updates: Config) {
  if (_config.value) {
    _config.value = deepReactive(JSON.parse(JSON.stringify(updates)))
  }
}

export function saveConfig () {
  MainProcess.saveConfig(JSON.parse(JSON.stringify(AppConfig())))
}
