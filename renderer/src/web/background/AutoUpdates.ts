import type { IpcUpdateInfo } from '@ipc/ipc-event'
import { MainProcess } from '@/web/background/IPC'
import { shallowRef } from 'vue'

export const updateInfo = shallowRef<IpcUpdateInfo['payload'] | null>(null)

MainProcess.onEvent('MAIN->OVERLAY::update-available', (e) => {
  updateInfo.value = e
})
