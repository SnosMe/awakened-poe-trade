import { reactive } from 'vue'
import { MainProcess } from '@/ipc/main-process-bindings'
import type { Config as ConfigType } from '@/ipc/types'
import type { Widget } from './overlay/interfaces'

export function getWidgetConfig<T extends Widget> (type: string) {
  return Config.store.widgets.find(w => w.wmType === type) as T | undefined
}

class ConfigService {
  store: ConfigType

  constructor () {
    this.store = reactive(MainProcess.getConfig())
  }

  saveConfig () {
    MainProcess.saveConfig(JSON.parse(JSON.stringify(this.store)))
  }
}

export const Config = new ConfigService()
