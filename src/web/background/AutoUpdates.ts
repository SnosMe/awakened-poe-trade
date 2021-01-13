import { UPDATE_AVAILABLE, IpcUpdateInfo } from '@/ipc/ipc-event'
import { MainProcess } from '@/ipc/main-process-bindings'
import { ref } from 'vue'

export const updateInfo = ref<IpcUpdateInfo | null>(null)

MainProcess.addEventListener(UPDATE_AVAILABLE, (e) => {
  updateInfo.value = (e as CustomEvent<IpcUpdateInfo>).detail
})
