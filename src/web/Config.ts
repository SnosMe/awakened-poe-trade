import { reactive } from 'vue'
import { MainProcess } from '@/ipc/main-process-bindings'
import type { Config as ConfigType } from '@/ipc/types'
import type { PriceCheckWidget } from './overlay/interfaces'

class ConfigService {
  store: ConfigType

  constructor () {
    this.store = reactive(MainProcess.getConfig())
  }

  saveConfig () {
    MainProcess.saveConfig(JSON.parse(JSON.stringify(this.store)))
  }

  get priceCheck () {
    return this.store.widgets.find(w => w.wmType === 'price-check') as PriceCheckWidget
  }
}

export const Config = new ConfigService()
