import Vue from 'vue'
import { ipcRenderer } from 'electron'
import { Config as ConfigType } from '@/shared/types'
import { GET_CONFIG } from '@/shared/ipc-event'

class ConfigService {
  store: ConfigType

  constructor () {
    this.store = Vue.observable(ipcRenderer.sendSync(GET_CONFIG))
  }
}

export const Config = new ConfigService()
