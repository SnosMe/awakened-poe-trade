import { reactive, toRaw } from 'vue'
import { MainProcess } from '@/ipc/main-process-bindings'
import { Config as ConfigType } from '@/ipc/types'
import { PUSH_CONFIG } from '@/ipc/ipc-event'

class ConfigService {
  store: ConfigType

  constructor () {
    this.store = reactive(MainProcess.getConfig())

    MainProcess.addEventListener(PUSH_CONFIG, (e) => {
      const config = (e as CustomEvent<ConfigType>).detail
      Object.assign(this.store, config)
    })
  }

  saveConfig () {
    MainProcess.saveConfig(toRaw(this.store))
  }
}

export const Config = new ConfigService()
