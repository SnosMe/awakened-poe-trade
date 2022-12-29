import type { IpcUpdateInfo } from '@ipc/types'
import { MainProcess } from '@/web/background/IPC'
import { shallowRef } from 'vue'

export const updateInfo = shallowRef<IpcUpdateInfo['payload'] | null>(null)

MainProcess.onEvent('MAIN->CLIENT::update-available', (e) => {
  updateInfo.value = e
})
